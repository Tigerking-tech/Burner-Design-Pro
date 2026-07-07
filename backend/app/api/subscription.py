"""
Subscription, Payment, and Admin API endpoints (Creem integration)
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
import uuid
import os

from app.models.user import (
    User, Order, OrderCreate, PaymentIntent,
    WithdrawalRequest, WithdrawalRequestCreate, WithdrawalRequestUpdate,
    SubscriptionUpdate,
)
from app.models.pricing import SUBSCRIPTION_TIERS
from app.api.auth import get_current_active_user, get_admin_user
from app.services.creem_client import get_creem_client
from app.services.database import (
    get_user_by_id, update_user_subscription,
    save_order, get_order, list_orders, update_order_status, delete_order,
    save_withdrawal, get_withdrawal, list_withdrawals,
    update_user_creem,
)
from app.services.email_service import send_cancel_subscription_email

router = APIRouter(prefix="/api", tags=["Subscription", "Payment", "Admin"])


def _dict_to_user(user_dict):
    return User(**user_dict)


def _dict_to_order(order_dict):
    return Order(**order_dict)


def _dict_to_withdrawal(w_dict):
    return WithdrawalRequest(**w_dict)


# ----------------------------------------------------------------------
# Subscription info
# ----------------------------------------------------------------------
@router.get("/subscription")
async def get_subscription(current_user: User = Depends(get_current_active_user)):
    """Get current user's subscription information"""
    
    # Auto-downgrade if subscription has expired
    # For users with creem_subscription_id, give a 30-day grace period 
    # to account for auto-renewal timing
    if current_user.subscription_tier != "free" and current_user.subscription_expires_at:
        grace_days = 30 if getattr(current_user, "creem_subscription_id", None) else 0
        cutoff = datetime.utcnow() - timedelta(days=grace_days)
        if current_user.subscription_expires_at < cutoff:
            update_user_subscription(
                user_id=current_user.id,
                tier="free",
                expires_at=None,
                is_active=True,
            )
            updated_user_dict = get_user_by_id(current_user.id)
            if updated_user_dict:
                current_user = _dict_to_user(updated_user_dict)
            print(f"[subscription] Auto-downgraded expired user {current_user.email} to free (grace_days={grace_days})")
    
    pending_orders = [o for o in list_orders() if o["user_id"] == current_user.id and o["status"] == "pending"]
    if pending_orders:
        try:
            creem = get_creem_client()
            for order in pending_orders:
                checkout_id = order.get("creem_checkout_id")
                if checkout_id:
                    try:
                        checkout_data = creem.get_checkout(checkout_id)
                        status = checkout_data.get("status") or checkout_data.get("data", {}).get("status")
                        if status and status.lower() in ("succeeded", "completed", "paid"):
                            update_order_status(order["id"], "succeeded")
                            update_user_subscription(
                                user_id=current_user.id,
                                tier="pro",
                                expires_at=datetime.utcnow() + timedelta(days=395),
                                is_active=True,
                            )
                            subscription_id = checkout_data.get("subscription_id") or checkout_data.get("data", {}).get("subscription_id")
                            if subscription_id:
                                update_user_creem(current_user.id, creem_subscription_id=str(subscription_id))
                            updated_user_dict = get_user_by_id(current_user.id)
                            if updated_user_dict:
                                current_user = _dict_to_user(updated_user_dict)
                            break
                    except Exception:
                        continue
        except Exception as e:
            print(f"[subscription] Auto-check pending orders failed: {e}")
    
    tier = SUBSCRIPTION_TIERS.get(current_user.subscription_tier, SUBSCRIPTION_TIERS["free"])
    
    # Fetch current_period_end from Creem if subscription is active, for display purposes
    current_period_end = None
    creem_status = None
    if getattr(current_user, "creem_subscription_id", None) and current_user.subscription_tier != "free":
        try:
            creem = get_creem_client()
            sub_data = creem.get_subscription(current_user.creem_subscription_id)
            if sub_data and "data" in sub_data and isinstance(sub_data["data"], dict):
                sub_data = sub_data["data"]
            creem_status = sub_data.get("status")
            period_end = (sub_data.get("current_period_end_date") 
                         or sub_data.get("current_period_end")
                         or sub_data.get("end_date"))
            if period_end:
                if isinstance(period_end, str):
                    current_period_end = datetime.fromisoformat(period_end.replace("Z", "+00:00"))
                elif isinstance(period_end, (int, float)):
                    current_period_end = datetime.utcfromtimestamp(period_end / 1000 if period_end > 1e12 else period_end)
        except Exception as e:
            print(f"[subscription] Error fetching current_period_end: {e}")

    auto_renewal_active = True
    if creem_status and creem_status.lower() in ("scheduled_cancel", "canceled", "cancelled"):
        auto_renewal_active = False

    result = {
        "success": True,
        "subscription": {
            "tier": current_user.subscription_tier,
            "tier_name": tier.name,
            "expires_at": current_user.subscription_expires_at,
            "current_period_end": current_period_end,
            "creem_status": creem_status,
            "is_active": current_user.is_active,
            "features": tier.features,
            "max_calculations": tier.max_calculations,
            "has_pdf_export": tier.has_pdf_export,
            "has_pro_calculators": tier.has_pro_calculators,
            "auto_renewal_active": auto_renewal_active,
        },
    }

    # Generate billing portal URL if user has Creem subscription
    customer_id = getattr(current_user, "creem_customer_id", None)
    subscription_id = getattr(current_user, "creem_subscription_id", None)
    
    if subscription_id and current_user.subscription_tier != "free":
        try:
            creem = get_creem_client()
            app_url = os.getenv("APP_URL", "http://localhost:3000").rstrip("/")
            
            # If we don't have customer_id but have subscription_id, fetch it from subscription
            if not customer_id:
                try:
                    sub_data = creem.get_subscription(subscription_id)
                    if sub_data and "data" in sub_data and isinstance(sub_data["data"], dict):
                        sub_data = sub_data["data"]
                    customer_id = sub_data.get("customer_id") or sub_data.get("customer", {}).get("id")
                    if customer_id:
                        update_user_creem(current_user.id, creem_customer_id=str(customer_id))
                        print(f"[subscription] Updated creem_customer_id for user {current_user.email}")
                except Exception as e:
                    print(f"[subscription] Error fetching customer_id from subscription: {e}")
            
            # Create billing portal using the correct Creem API endpoint: /v1/customers/billing
            if customer_id:
                try:
                    portal_resp = creem.create_customer_portal(
                        customer_id=str(customer_id),
                        return_url=f"{app_url}/subscription"
                    )
                    # Creem API returns {"customer_portal_link": "<string>"}
                    portal_url = (
                        portal_resp.get("customer_portal_link")
                        or portal_resp.get("portal_url") 
                        or portal_resp.get("url") 
                        or portal_resp.get("data", {}).get("customer_portal_link")
                        or portal_resp.get("data", {}).get("portal_url")
                        or portal_resp.get("data", {}).get("url")
                    )
                    if portal_url:
                        result["subscription"]["billing_portal_url"] = portal_url
                        print(f"[subscription] Billing portal URL generated for {current_user.email}")
                    else:
                        print(f"[subscription] No portal URL found in response keys: {list(portal_resp.keys()) if isinstance(portal_resp, dict) else portal_resp}")
                except Exception as e:
                    print(f"[subscription] Error creating customer portal: {e}")
        except Exception as e:
            print(f"[subscription] Error getting billing portal: {e}")

    return result


@router.post("/subscription/cancel")
async def cancel_subscription(current_user: User = Depends(get_current_active_user)):
    """Cancel current subscription (via Creem if applicable).
    
    Note: This cancels auto-renewal on Creem side. The user keeps Pro access
    until the current billing period ends (subscription_expires_at).
    
    After calling Creem API, we verify the cancellation by checking subscription status.
    """
    if current_user.subscription_tier == "free":
        return {"success": True, "message": "Already on free plan"}

    creem_success = False
    creem_error = None
    cancelled_sub_id = None
    verified_status = None

    try:
        creem = get_creem_client()

        customer_id = getattr(current_user, "creem_customer_id", None)
        stored_sub_id = getattr(current_user, "creem_subscription_id", None)

        # Step 1: Find and cancel active subscription
        if customer_id:
            try:
                subs_result = creem.search_subscriptions(customer_id=customer_id, page_size=100)
                items = subs_result.get("items") or subs_result.get("data") or subs_result.get("subscriptions") or []
                for sub in items:
                    sub_status = str(sub.get("status") or "").lower()
                    sub_id = sub.get("id") or sub.get("subscription_id")
                    if sub_status in ("active", "trialing") and sub_id:
                        try:
                            creem.cancel_subscription(sub_id)
                            cancelled_sub_id = sub_id
                            print(f"[subscription] Called cancel for subscription {sub_id}")
                            break
                        except Exception as e:
                            print(f"[subscription] Failed to cancel sub {sub_id}: {e}")
            except Exception as e:
                print(f"[subscription] Error searching subscriptions for customer {customer_id}: {e}")

        # Try stored subscription_id if customer_id search didn't find anything
        if not cancelled_sub_id and stored_sub_id:
            try:
                creem.cancel_subscription(stored_sub_id)
                cancelled_sub_id = stored_sub_id
                print(f"[subscription] Called cancel for stored subscription {stored_sub_id}")
            except Exception as e:
                print(f"[subscription] Error canceling stored subscription {stored_sub_id}: {e}")
                creem_error = str(e)

        # Step 2: Verify cancellation by checking subscription status
        if cancelled_sub_id:
            try:
                verify_data = creem.get_subscription(cancelled_sub_id)
                if verify_data and "data" in verify_data and isinstance(verify_data["data"], dict):
                    verify_data = verify_data["data"]
                verified_status = str(verify_data.get("status") or "").lower()
                print(f"[subscription] Verified status after cancel: {verified_status}")
                if verified_status in ("scheduled_cancel", "canceled"):
                    creem_success = True
                    print(f"[subscription] Cancellation VERIFIED on Creem: {verified_status}")
                else:
                    print(f"[subscription] Cancellation NOT verified - status is: {verified_status}")
            except Exception as e:
                print(f"[subscription] Error verifying cancellation: {e}")

        # Update stored subscription_id
        if cancelled_sub_id and stored_sub_id != cancelled_sub_id:
            update_user_creem(current_user.id, creem_subscription_id=str(cancelled_sub_id))

    except Exception as e:
        print(f"[subscription] Unexpected error in cancel_subscription: {e}")
        creem_error = str(e)

    expires_at = current_user.subscription_expires_at
    expires_display = expires_at.strftime("%Y-%m-%d") if expires_at else "end of current billing period"

    if creem_success:
        await send_cancel_subscription_email(current_user.email, expires_display)
        return {
            "success": True,
            "message": f"Auto-renewal cancelled successfully. Your Pro access will remain active until {expires_display}. No further charges will occur.",
            "subscription": "pro",
            "expires_at": expires_at,
            "creem_status": verified_status,
            "auto_renewal_active": False,
        }
    else:
        return {
            "success": True,
            "message": f"Auto-renewal cancelled locally. Your Pro access will remain active until {expires_display}. Please verify in your Creem billing portal.",
            "subscription": "pro",
            "expires_at": expires_at,
            "creem_status": verified_status,
            "auto_renewal_active": True,
            "creem_error": creem_error,
        }


@router.post("/subscription/pause")
async def pause_subscription(current_user: User = Depends(get_current_active_user)):
    """Pause current subscription via Creem."""
    if current_user.subscription_tier == "free":
        raise HTTPException(status_code=400, detail="No active subscription to pause")

    subscription_id = getattr(current_user, "creem_subscription_id", None)
    if not subscription_id:
        raise HTTPException(status_code=400, detail="No Creem subscription found")

    try:
        creem = get_creem_client()
        result = creem.pause_subscription(subscription_id)
        print(f"[subscription] Paused subscription {subscription_id}")
        return {"success": True, "message": "Subscription paused successfully", "result": result}
    except Exception as e:
        print(f"[subscription] Error pausing subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to pause subscription: {e}")


@router.post("/subscription/resume")
async def resume_subscription(current_user: User = Depends(get_current_active_user)):
    """Resume a paused subscription via Creem."""
    subscription_id = getattr(current_user, "creem_subscription_id", None)
    if not subscription_id:
        raise HTTPException(status_code=400, detail="No Creem subscription found")

    try:
        creem = get_creem_client()
        result = creem.resume_subscription(subscription_id)
        print(f"[subscription] Resumed subscription {subscription_id}")
        return {"success": True, "message": "Subscription resumed successfully", "result": result}
    except Exception as e:
        print(f"[subscription] Error resuming subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to resume subscription: {e}")


# ----------------------------------------------------------------------
# Checkout creation
# ----------------------------------------------------------------------
@router.post("/payment/create-checkout")
async def create_checkout(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a Creem hosted checkout session.
    Returns a checkout URL the frontend can redirect to.
    """
    if order_data.tier not in SUBSCRIPTION_TIERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription tier",
        )

    product_ids = {
        "pro": os.getenv("CREEM_PRO_PRODUCT_ID", "").strip(),
    }

    product_id = product_ids.get(order_data.tier, "")
    if not product_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Creem product not configured for this tier",
        )

    tier = SUBSCRIPTION_TIERS[order_data.tier]
    app_url = os.getenv("APP_URL", "http://localhost:3000").rstrip("/")
    
    order_id = str(uuid.uuid4())
    success_url = f"{app_url}/subscription/success?order_id={order_id}"
    cancel_url = f"{app_url}/subscription"

    try:
        creem = get_creem_client()

        customer_id = getattr(current_user, "creem_customer_id", None)
        
        if not customer_id:
            try:
                customer_data = creem.create_customer(
                    email=current_user.email,
                    name=getattr(current_user, "full_name", "") or ""
                )
                customer_id = customer_data.get("customer_id") or customer_data.get("id")
                if customer_id:
                    update_user_creem(current_user.id, creem_customer_id=str(customer_id))
            except Exception as e:
                print(f"[payment] Error creating customer: {e}")

        checkout_data = creem.create_checkout(
            product_id=product_id,
            customer_id=customer_id,
            success_url=success_url,
            metadata={
                "user_id": current_user.id,
                "tier": order_data.tier,
                "user_email": current_user.email,
            },
        )

        checkout_url = checkout_data.get("checkout_url") or checkout_data.get("url")
        checkout_id = checkout_data.get("checkout_id") or checkout_data.get("id")

        if not checkout_url:
            raise Exception("Creem did not return a checkout URL")

        save_order(
            order_id=order_id,
            user_id=current_user.id,
            user_email=current_user.email,
            tier=order_data.tier,
            amount=tier.price,
            currency="usd",
            creem_checkout_id=checkout_id,
            status="pending",
        )

        return {
            "success": True,
            "checkout_url": checkout_url,
            "checkout_id": checkout_id,
            "order_id": order_id,
        }

    except Exception as e:
        print(f"[payment] Error creating Creem checkout: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout: {e}",
        )


# ----------------------------------------------------------------------
# Post-checkout: frontend polls after returning from Creem
# ----------------------------------------------------------------------
@router.post("/payment/confirm/{order_id}")
async def confirm_payment(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """
    Called by the frontend after the user is redirected back from
    the Creem checkout. Activates the user's subscription if
    the associated order has been marked "succeeded" by the webhook
    OR if Creem confirms the payment was successful.
    """
    order_dict = get_order(order_id)
    if not order_dict:
        raise HTTPException(status_code=404, detail="Order not found")

    if order_dict["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this order")

    if order_dict["status"] == "succeeded":
        return {
            "success": True,
            "message": "Payment already confirmed",
            "subscription": current_user.subscription_tier,
            "expires_at": current_user.subscription_expires_at,
        }

    if order_dict["status"] == "pending":
        checkout_id = order_dict.get("creem_checkout_id")
        if checkout_id:
            try:
                creem = get_creem_client()
                checkout_data = creem.get_checkout(checkout_id)
                checkout_status = checkout_data.get("status") or checkout_data.get("data", {}).get("status")
                
                if checkout_status and checkout_status.lower() in ("succeeded", "completed", "paid"):
                    update_order_status(order_id, "succeeded")
                    update_user_subscription(
                        user_id=current_user.id,
                        tier="pro",
                        expires_at=datetime.utcnow() + timedelta(days=365),
                        is_active=True,
                    )
                    
                    subscription_id = checkout_data.get("subscription_id") or checkout_data.get("data", {}).get("subscription_id")
                    if subscription_id:
                        update_user_creem(current_user.id, creem_subscription_id=str(subscription_id))
                    
                    return {
                        "success": True,
                        "message": "Payment confirmed successfully",
                        "subscription": "pro",
                    }
            except Exception as e:
                print(f"[payment] Error checking Creem checkout status: {e}")

        return {
            "success": False,
            "message": "Payment is still being processed. Please refresh shortly.",
        }

    return {
        "success": False,
        "message": f"Order status: {order_dict['status']}",
    }


@router.get("/orders", response_model=List[Dict[str, Any]])
async def get_orders(current_user: User = Depends(get_current_active_user)):
    """Get current user's order history"""
    all_orders = list_orders()
    user_orders = [
        {
            "id": o["id"],
            "tier": o["tier"],
            "amount": o["amount"],
            "status": o["status"],
            "created_at": o["created_at"],
            "updated_at": o["updated_at"],
        }
        for o in all_orders
        if o["user_id"] == current_user.id
    ]
    return user_orders


@router.post("/subscription/refresh")
async def refresh_subscription(current_user: User = Depends(get_current_active_user)):
    """
    Manually refresh subscription status from Creem.
    Useful when webhook didn't fire but payment was successful.
    Also saves creem_subscription_id if missing.
    """
    try:
        creem = get_creem_client()
        updated = False
        active_sub = None
        
        customer_id = getattr(current_user, "creem_customer_id", None)
        subscription_id = getattr(current_user, "creem_subscription_id", None)
        
        print(f"[refresh_subscription] user={current_user.email}, tier={current_user.subscription_tier}, "
              f"customer_id={customer_id}, subscription_id={subscription_id}")
        
        if subscription_id:
            try:
                sub_data = creem.get_subscription(subscription_id)
                print(f"[refresh_subscription] get_subscription result keys: {list(sub_data.keys()) if sub_data else 'None'}")
                # Unwrap if nested in data field
                if sub_data and "data" in sub_data and isinstance(sub_data["data"], dict):
                    sub_data = sub_data["data"]
                if sub_data and (sub_data.get("status") or sub_data.get("id") or sub_data.get("subscription_id")):
                    active_sub = sub_data
            except Exception as e:
                print(f"[refresh_subscription] get_subscription failed: {e}")
        
        if not customer_id:
            try:
                customer_data = creem.get_customer(email=current_user.email)
                print(f"[refresh_subscription] get_customer by email result keys: {list(customer_data.keys())}")
                # Unwrap if nested in data field
                if customer_data and "data" in customer_data and isinstance(customer_data["data"], dict):
                    customer_data = customer_data["data"]
                cust_id = customer_data.get("customer_id") or customer_data.get("id")
                if cust_id:
                    customer_id = str(cust_id)
                    update_user_creem(current_user.id, creem_customer_id=customer_id)
                    updated = True
                    print(f"[refresh_subscription] found customer_id by email: {customer_id}")
            except Exception as e:
                print(f"[refresh_subscription] get_customer by email failed: {e}")
        
        if not active_sub and customer_id:
            try:
                subs_result = creem.search_subscriptions(customer_id=customer_id)
                print(f"[refresh_subscription] search_subscriptions result keys: {list(subs_result.keys())}")
                items = subs_result.get("items") or subs_result.get("data") or subs_result.get("subscriptions") or []
                print(f"[refresh_subscription] found {len(items)} subscriptions")
                for sub in items:
                    sub_status = sub.get("status", "").lower()
                    sub_id = sub.get("id") or sub.get("subscription_id")
                    print(f"[refresh_subscription]   sub id={sub_id}, status={sub_status}")
                    if sub_status in ("active", "trialing", "scheduled_cancel"):
                        active_sub = sub
                        break
            except Exception as e:
                print(f"[refresh_subscription] search_subscriptions failed: {e}")
        
        if active_sub:
            sub_id = active_sub.get("id") or active_sub.get("subscription_id")
            sub_status = active_sub.get("status", "").lower()
            is_active = sub_status in ("active", "trialing", "scheduled_cancel")
            
            period_end = (active_sub.get("current_period_end_date") 
                         or active_sub.get("current_period_end")
                         or active_sub.get("end_date")
                         or active_sub.get("expires_at"))
            period_end_dt = None
            if period_end:
                try:
                    if isinstance(period_end, str):
                        period_end_dt = datetime.fromisoformat(period_end.replace("Z", "+00:00"))
                    elif isinstance(period_end, (int, float)):
                        period_end_dt = datetime.utcfromtimestamp(period_end / 1000 if period_end > 1e12 else period_end)
                except Exception:
                    pass
            
            # Calculate expires_at based on subscription status:
            # - active/trialing (auto-renewing): current_period_end + 30 days grace period
            # - scheduled_cancel (cancelled but still valid): current_period_end exactly
            if sub_status in ("active", "trialing"):
                if period_end_dt:
                    expires_at = period_end_dt + timedelta(days=30)
                else:
                    expires_at = datetime.utcnow() + timedelta(days=395)  # ~13 months
            elif sub_status == "scheduled_cancel":
                expires_at = period_end_dt if period_end_dt else datetime.utcnow() + timedelta(days=30)
            else:
                expires_at = period_end_dt if period_end_dt else datetime.utcnow() + timedelta(days=365)
            
            if is_active:
                update_user_subscription(
                    user_id=current_user.id,
                    tier="pro",
                    expires_at=expires_at,
                    is_active=True,
                )
                updated = True
            
            if sub_id and (not subscription_id or subscription_id != str(sub_id)):
                update_user_creem(current_user.id, creem_subscription_id=str(sub_id))
                updated = True
            
            customer_id_from_sub = active_sub.get("customer_id")
            if customer_id_from_sub and not getattr(current_user, "creem_customer_id", None):
                update_user_creem(current_user.id, creem_customer_id=str(customer_id_from_sub))
                updated = True
            
            # Only mark the most recent pending order as succeeded if its checkout is confirmed.
            # In subscription mode there should only be one initial checkout order per user.
            pending_orders = [
                o for o in list_orders()
                if o["user_id"] == current_user.id and o["status"] == "pending"
            ]
            if pending_orders:
                # Sort by created_at descending and check only the latest pending order
                most_recent = sorted(pending_orders, key=lambda o: o.get("created_at", ""), reverse=True)[0]
                checkout_id = most_recent.get("creem_checkout_id")
                if checkout_id:
                    try:
                        checkout_data = creem.get_checkout(checkout_id)
                        checkout_status = checkout_data.get("status") or checkout_data.get("data", {}).get("status")
                        if checkout_status and checkout_status.lower() in ("succeeded", "completed", "paid"):
                            update_order_status(most_recent["id"], "succeeded")
                            updated = True
                    except Exception as e:
                        print(f"[refresh_subscription] Error confirming pending order checkout: {e}")
            
            if updated:
                return {
                    "success": True,
                    "message": "Subscription refreshed successfully",
                    "tier": "pro",
                }
            else:
                return {
                    "success": True,
                    "message": "Subscription status is up to date",
                    "tier": current_user.subscription_tier,
                }
        
        all_orders = list_orders()
        user_orders = [o for o in all_orders if o["user_id"] == current_user.id]
        
        for order in user_orders:
            checkout_id = order.get("creem_checkout_id")
            if not checkout_id:
                continue
            try:
                checkout_data = creem.get_checkout(checkout_id)
                status = checkout_data.get("status") or checkout_data.get("data", {}).get("status")
                if status and status.lower() in ("succeeded", "completed", "paid"):
                    if order["status"] != "succeeded":
                        update_order_status(order["id"], "succeeded")
                        updated = True
                    
                    sub_info = checkout_data.get("subscription") or checkout_data.get("data", {}).get("subscription")
                    if isinstance(sub_info, dict):
                        sub_id = sub_info.get("id")
                    else:
                        sub_id = checkout_data.get("subscription_id") or checkout_data.get("data", {}).get("subscription_id")
                    
                    if sub_id and subscription_id != str(sub_id):
                        update_user_creem(current_user.id, creem_subscription_id=str(sub_id))
                        updated = True
                    
                    if current_user.subscription_tier != "pro":
                        update_user_subscription(
                            user_id=current_user.id,
                            tier="pro",
                            expires_at=datetime.utcnow() + timedelta(days=365),
                            is_active=True,
                        )
                        updated = True
                    
                    if updated:
                        return {
                            "success": True,
                            "message": "Payment confirmed from checkout",
                            "tier": "pro",
                        }
            except Exception:
                continue
        
        if current_user.subscription_tier == "pro":
            return {
                "success": True,
                "message": "Subscription is already active",
                "tier": "pro",
            }
        
        return {
            "success": False,
            "message": "No active subscription found in Creem",
            "tier": current_user.subscription_tier,
        }
    
    except Exception as e:
        print(f"[subscription] Error refreshing subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh subscription: {e}",
        )


# ----------------------------------------------------------------------
# Products listing
# ----------------------------------------------------------------------
@router.get("/products")
async def get_products():
    """Public list of available subscription products"""
    products = []

    for tier_key, tier in SUBSCRIPTION_TIERS.items():
        if tier_key == "free":
            continue

        configured = False
        product_id = ""
        if tier_key == "pro":
            product_id = os.getenv("CREEM_PRO_PRODUCT_ID", "").strip()
            configured = bool(product_id)

        print(f"[products] Tier '{tier_key}': product_id='{product_id}', configured={configured}")

        products.append(
            {
                "tier": tier_key,
                "name": tier.name,
                "price": tier.price,
                "price_display": tier.price_display,
                "features": tier.features,
                "creem_product_id": product_id,
                "is_configured": configured,
            }
        )

    return {"success": True, "products": products}


# ----------------------------------------------------------------------
# Admin
# ----------------------------------------------------------------------
@router.get("/admin/users", response_model=List[User])
async def get_all_users(admin_user: User = Depends(get_admin_user)):
    from app.services.database import list_users
    all_users = list_users()
    return [_dict_to_user(u) for u in all_users]


@router.patch("/admin/users/{user_id}/subscription")
async def update_user_subscription_admin(
    user_id: str,
    update_data: SubscriptionUpdate,
    admin_user: User = Depends(get_admin_user),
):
    # Check user exists
    if not get_user_by_id(user_id):
        raise HTTPException(status_code=404, detail="User not found")

    update_user_subscription(
        user_id=user_id,
        tier=update_data.tier,
        expires_at=update_data.expires_at,
        is_active=update_data.is_active,
    )

    user_dict = get_user_by_id(user_id)
    return {"success": True, "user": _dict_to_user(user_dict)}


@router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(admin_user: User = Depends(get_admin_user)):
    orders = list_orders()
    return [_dict_to_order(o) for o in orders]


@router.delete("/admin/orders/{order_id}")
async def delete_order_admin(order_id: str, admin_user: User = Depends(get_admin_user)):
    if not get_order(order_id):
        raise HTTPException(status_code=404, detail="Order not found")
    delete_order(order_id)
    return {"success": True, "message": "Order deleted"}


@router.post("/admin/cleanup-duplicate-orders")
async def cleanup_duplicate_orders(
    user_id: Optional[str] = None,
    admin_user: User = Depends(get_admin_user),
):
    """
    Clean up duplicate succeeded orders.
    For each user, keeps only one succeeded order per day, removing the rest.

    If `user_id` is provided, only that user's orders are cleaned.
    """
    all_orders = list_orders()
    succeeded_orders = [o for o in all_orders if o["status"] == "succeeded"]

    if user_id:
        succeeded_orders = [o for o in succeeded_orders if o["user_id"] == user_id]

    # Group by user_id and date
    groups = {}
    for order in succeeded_orders:
        key = (order["user_id"], order["created_at"].date())
        if key not in groups:
            groups[key] = []
        groups[key].append(order)

    deleted_count = 0
    for (order_user_id, date), orders_in_group in groups.items():
        if len(orders_in_group) > 1:
            # Keep the most recent one (first by created_at desc)
            orders_in_group.sort(key=lambda o: o["created_at"], reverse=True)
            to_delete = orders_in_group[1:]
            for order in to_delete:
                delete_order(order["id"])
                deleted_count += 1

    scope = f"user {user_id}" if user_id else "all users"
    return {
        "success": True,
        "message": f"Cleaned up {deleted_count} duplicate succeeded orders for {scope}",
        "deleted_count": deleted_count,
        "user_id": user_id,
    }


@router.get("/admin/revenue")
async def get_revenue(admin_user: User = Depends(get_admin_user)):
    orders = list_orders()
    succeeded_orders = [o for o in orders if o["status"] == "succeeded"]
    local_revenue = sum(o["amount"] for o in succeeded_orders)

    creem_revenue_cents = 0
    creem_transaction_count = 0
    creem_subscriptions = []
    use_creem = False
    try:
        creem = get_creem_client()

        # Fetch all pages of paid transactions from Creem.
        # Only successful (paid) transactions count as revenue.
        txn_page = 1
        seen_txn_ids = set()
        while True:
            txn_resp = creem.list_transactions(page_number=txn_page, page_size=100)
            txn_items = txn_resp.get("data") or txn_resp.get("transactions") or txn_resp.get("items") or []
            for txn in txn_items:
                txn_id = txn.get("id")
                if txn_id in seen_txn_ids:
                    continue
                seen_txn_ids.add(txn_id)

                txn_status = str(txn.get("status") or "").lower()
                if txn_status != "paid":
                    continue

                # Use amount_paid when available; otherwise fall back to amount.
                amount = txn.get("amount_paid")
                if amount is None:
                    amount = txn.get("amount") or txn.get("total") or 0
                amount_cents = int(float(amount or 0))

                # Subtract refunded amount for net revenue.
                refunded = int(float(txn.get("refunded_amount") or 0))
                net_amount = max(0, amount_cents - refunded)

                creem_revenue_cents += net_amount
                creem_transaction_count += 1

            pagination = txn_resp.get("pagination") or {}
            total_pages = pagination.get("total_pages") or 1
            if txn_page >= total_pages or not txn_items:
                break
            txn_page += 1

        # Fetch all pages of subscriptions from Creem.
        sub_page = 1
        seen_sub_ids = set()
        while True:
            sub_resp = creem.search_subscriptions(page_size=100, page_number=sub_page)
            sub_items = sub_resp.get("data") or sub_resp.get("items") or sub_resp.get("subscriptions") or []
            for sub in sub_items:
                sub_id = sub.get("id") or sub.get("subscription_id")
                if not sub_id or sub_id in seen_sub_ids:
                    continue
                seen_sub_ids.add(sub_id)

                sub_status = str(sub.get("status") or "").lower()
                creem_subscriptions.append({
                    "subscription_id": sub_id,
                    "customer_id": sub.get("customer_id"),
                    "status": sub_status,
                    "current_period_end": sub.get("current_period_end") or sub.get("current_period_end_date"),
                })

            pagination = sub_resp.get("pagination") or {}
            total_pages = pagination.get("total_pages") or 1
            if sub_page >= total_pages or not sub_items:
                break
            sub_page += 1

        use_creem = True
        print(f"[admin/revenue] Creem data: {creem_transaction_count} paid transactions, "
              f"{creem_revenue_cents} cents revenue, {len(creem_subscriptions)} subscriptions")
    except Exception as e:
        print(f"[admin/revenue] Error listing Creem data: {e}")

    # Active subscriptions: currently paying or scheduled to cancel at period end.
    active_subscription_count = len([
        s for s in creem_subscriptions
        if s.get("status") in ("active", "trialing", "scheduled_cancel")
    ])

    # Prefer Creem numbers when available; otherwise fall back to local orders.
    total_revenue_cents = creem_revenue_cents if use_creem else local_revenue
    transaction_count = creem_transaction_count if use_creem else len(succeeded_orders)

    return {
        "success": True,
        "total_revenue_cents": total_revenue_cents,
        "total_revenue_display": f"${total_revenue_cents / 100:.2f}",
        "total_orders": transaction_count,
        "successful_orders": transaction_count,
        "creem_revenue_cents": creem_revenue_cents,
        "creem_revenue_display": f"${creem_revenue_cents / 100:.2f}",
        "creem_transaction_count": creem_transaction_count,
        "active_subscriptions": active_subscription_count if use_creem else len(succeeded_orders),
        "source": "creem" if use_creem else "local",
    }


@router.post("/admin/withdrawals")
async def create_withdrawal(
    withdrawal_data: WithdrawalRequestCreate,
    admin_user: User = Depends(get_admin_user),
):
    revenue_resp = await get_revenue(admin_user)
    total_revenue = revenue_resp.get("creem_revenue_cents", 0)

    if withdrawal_data.amount > total_revenue:
        raise HTTPException(
            status_code=400,
            detail="Withdrawal amount exceeds available revenue",
        )

    withdrawal_id = str(uuid.uuid4())
    save_withdrawal(
        withdrawal_id=withdrawal_id,
        admin_id=admin_user.id,
        admin_email=admin_user.email,
        amount=withdrawal_data.amount,
        payment_method=withdrawal_data.payment_method,
        status="pending",
        notes=withdrawal_data.notes,
        currency="usd",
    )

    w_dict = get_withdrawal(withdrawal_id)
    return {"success": True, "withdrawal": _dict_to_withdrawal(w_dict)}


@router.get("/admin/withdrawals", response_model=List[WithdrawalRequest])
async def get_withdrawals(admin_user: User = Depends(get_admin_user)):
    withdrawals = list_withdrawals()
    return [_dict_to_withdrawal(w) for w in withdrawals]


@router.patch("/admin/withdrawals/{withdrawal_id}")
async def update_withdrawal(
    withdrawal_id: str,
    update_data: WithdrawalRequestUpdate,
    admin_user: User = Depends(get_admin_user),
):
    from app.services.database import update_withdrawal_status
    if not get_withdrawal(withdrawal_id):
        raise HTTPException(status_code=404, detail="Withdrawal request not found")

    if update_data.status:
        update_withdrawal_status(withdrawal_id, update_data.status)
    w_dict = get_withdrawal(withdrawal_id)
    return {"success": True, "withdrawal": _dict_to_withdrawal(w_dict)}
