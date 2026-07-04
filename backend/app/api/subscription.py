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
    save_order, get_order, list_orders, update_order_status,
    save_withdrawal, get_withdrawal, list_withdrawals,
    update_user_creem,
)

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
    if current_user.subscription_tier != "free" and current_user.subscription_expires_at:
        if current_user.subscription_expires_at < datetime.utcnow():
            update_user_subscription(
                user_id=current_user.id,
                tier="free",
                expires_at=None,
                is_active=True,
            )
            updated_user_dict = get_user_by_id(current_user.id)
            if updated_user_dict:
                current_user = _dict_to_user(updated_user_dict)
            print(f"[subscription] Auto-downgraded expired user {current_user.email} to free")
    
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
                                expires_at=datetime.utcnow() + timedelta(days=365),
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

    result = {
        "success": True,
        "subscription": {
            "tier": current_user.subscription_tier,
            "tier_name": tier.name,
            "expires_at": current_user.subscription_expires_at,
            "is_active": current_user.is_active,
            "features": tier.features,
            "max_calculations": tier.max_calculations,
            "has_pdf_export": tier.has_pdf_export,
            "has_pro_calculators": tier.has_pro_calculators,
        },
    }

    if getattr(current_user, "creem_customer_id", None):
        try:
            creem = get_creem_client()
            app_url = os.getenv("APP_URL", "http://localhost:3000").rstrip("/")
            portal_resp = creem.create_customer_portal(
                customer_id=current_user.creem_customer_id,
                return_url=f"{app_url}/subscription"
            )
            portal_url = portal_resp.get("portal_url") or portal_resp.get("url")
            if portal_url:
                result["subscription"]["billing_portal_url"] = portal_url
        except Exception as e:
            print(f"[subscription] Error getting billing portal: {e}")

    return result


@router.post("/subscription/cancel")
async def cancel_subscription(current_user: User = Depends(get_current_active_user)):
    """Cancel current subscription (via Creem if applicable).
    
    Note: This cancels auto-renewal on Creem side. The user keeps Pro access
    until the current billing period ends (subscription_expires_at).
    """
    if current_user.subscription_tier == "free":
        return {"success": True, "message": "Already on free plan"}

    creem_error = None

    # Cancel on Creem side if there's an active subscription id
    if getattr(current_user, "creem_subscription_id", None):
        try:
            creem = get_creem_client()
            creem.cancel_subscription(current_user.creem_subscription_id)
        except Exception as e:
            print(f"[subscription] Error canceling Creem subscription: {e}")
            creem_error = str(e)
    
    # If no subscription id stored, try to find active subscription from Creem customer
    if not getattr(current_user, "creem_subscription_id", None) and getattr(current_user, "creem_customer_id", None):
        try:
            creem = get_creem_client()
            customer_data = creem.get_customer(customer_id=current_user.creem_customer_id)
            subscriptions = customer_data.get("subscriptions", [])
            if isinstance(subscriptions, dict):
                subscriptions = list(subscriptions.values())
            
            active_sub = None
            for sub in subscriptions:
                if isinstance(sub, dict):
                    sub_status = sub.get("status", "").lower()
                    if sub_status in ("active", "trialing"):
                        active_sub = sub
                        break
            
            if active_sub:
                subscription_id = active_sub.get("id") or active_sub.get("subscription_id")
                if subscription_id:
                    creem.cancel_subscription(subscription_id)
                    update_user_creem(current_user.id, creem_subscription_id=str(subscription_id))
        except Exception as e:
            print(f"[subscription] Error finding/canceling Creem subscription: {e}")
            creem_error = str(e)

    # Keep user as Pro until subscription_expires_at.
    # The auto-downgrade happens when get_subscription detects expiration.
    expires_at = current_user.subscription_expires_at
    expires_display = expires_at.strftime("%Y-%m-%d") if expires_at else "end of current billing period"

    if creem_error:
        return {
            "success": True,
            "message": f"Auto-renewal cancelled. Your Pro access will remain active until {expires_display}. Creem cancellation may need manual confirmation.",
            "subscription": "pro",
            "expires_at": expires_at,
        }

    return {
        "success": True,
        "message": f"Subscription cancelled successfully. Your Pro access will remain active until {expires_display}.",
        "subscription": "pro",
        "expires_at": expires_at,
    }


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
            expires_at = None
            if period_end:
                try:
                    if isinstance(period_end, str):
                        expires_at = datetime.fromisoformat(period_end.replace("Z", "+00:00"))
                    elif isinstance(period_end, (int, float)):
                        expires_at = datetime.utcfromtimestamp(period_end / 1000 if period_end > 1e12 else period_end)
                except Exception:
                    pass
            
            if not expires_at:
                expires_at = datetime.utcnow() + timedelta(days=365)
            
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
            
            pending_orders = list_orders()
            for o in pending_orders:
                if o["user_id"] == current_user.id and o["status"] == "pending":
                    update_order_status(o["id"], "succeeded")
                    updated = True
            
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


@router.get("/admin/revenue")
async def get_revenue(admin_user: User = Depends(get_admin_user)):
    orders = list_orders()
    succeeded_orders = [o for o in orders if o["status"] == "succeeded"]
    total_revenue = sum(o["amount"] for o in succeeded_orders)

    creem_revenue_cents = 0
    try:
        creem = get_creem_client()
        txn_resp = creem.list_transactions()
        for txn in (txn_resp.get("data") or txn_resp.get("transactions") or []):
            amount = txn.get("amount") or txn.get("total") or 0
            creem_revenue_cents += int(float(amount or 0))
    except Exception as e:
        print(f"[admin/revenue] Error listing Creem transactions: {e}")

    return {
        "success": True,
        "total_revenue_cents": total_revenue,
        "total_revenue_display": f"${total_revenue / 100:.2f}",
        "total_orders": len(orders),
        "succeeded_orders": len(succeeded_orders),
        "creem_revenue_cents": creem_revenue_cents,
        "creem_revenue_display": f"${creem_revenue_cents / 100:.2f}",
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
