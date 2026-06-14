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
    in_memory_users, in_memory_orders, in_memory_withdrawals, SubscriptionUpdate,
)
from app.models.pricing import SUBSCRIPTION_TIERS
from app.api.auth import get_current_active_user, get_admin_user
from app.services.creem_client import get_creem_client

router = APIRouter(prefix="/api", tags=["Subscription", "Payment", "Admin"])


# ----------------------------------------------------------------------
# Subscription info
# ----------------------------------------------------------------------
@router.get("/subscription")
async def get_subscription(current_user: User = Depends(get_current_active_user)):
    """Get current user's subscription information"""
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

    # Add billing portal URL if the user has an active Creem subscription
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
    """Cancel current subscription (via Creem if applicable)"""
    if current_user.subscription_tier == "free":
        return {"success": True, "message": "Already on free plan"}

    # Cancel on Creem side if there's an active subscription id
    if getattr(current_user, "creem_subscription_id", None):
        try:
            creem = get_creem_client()
            creem.cancel_subscription(current_user.creem_subscription_id)
        except Exception as e:
            print(f"[subscription] Error canceling Creem subscription: {e}")

    # Downgrade user to free tier locally
    current_user.subscription_tier = "free"
    current_user.subscription_expires_at = None
    current_user.updated_at = datetime.utcnow()

    return {
        "success": True,
        "message": "Subscription cancelled successfully",
        "subscription": current_user.subscription_tier,
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

    # Map tier to configured Creem Product ID
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
    success_url = f"{app_url}/subscription/success"
    cancel_url = f"{app_url}/subscription"

    try:
        creem = get_creem_client()

        checkout_data = creem.create_checkout(
            product_id=product_id,
            customer_email=current_user.email,
            success_url=success_url,
            cancel_url=cancel_url,
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

        # Persist the order locally so we can match it when the webhook fires
        order_id = str(uuid.uuid4())
        order = Order(
            id=order_id,
            user_id=current_user.id,
            user_email=current_user.email,
            tier=order_data.tier,
            amount=tier.price,
            status="pending",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        order.creem_checkout_id = checkout_id
        in_memory_orders[order_id] = order

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
    the associated order has been marked "succeeded" by the webhook.
    """
    order = in_memory_orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this order")

    if order.status == "succeeded":
        return {
            "success": True,
            "message": "Payment already confirmed",
            "subscription": current_user.subscription_tier,
            "expires_at": current_user.subscription_expires_at,
        }

    if order.status == "pending":
        return {
            "success": False,
            "message": "Payment is still being processed. Please refresh shortly.",
        }

    return {
        "success": False,
        "message": f"Order status: {order.status}",
    }


@router.get("/orders", response_model=List[Dict[str, Any]])
async def get_orders(current_user: User = Depends(get_current_active_user)):
    """Get current user's order history"""
    user_orders = [
        {
            "id": order.id,
            "tier": order.tier,
            "amount": order.amount,
            "status": order.status,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
        }
        for order in in_memory_orders.values()
        if order.user_id == current_user.id
    ]
    return user_orders


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
    return list(in_memory_users.values())


@router.patch("/admin/users/{user_id}/subscription")
async def update_user_subscription(
    user_id: str,
    update_data: SubscriptionUpdate,
    admin_user: User = Depends(get_admin_user),
):
    user = in_memory_users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if update_data.tier:
        user.subscription_tier = update_data.tier
    if update_data.expires_at is not None:
        user.subscription_expires_at = update_data.expires_at
    if update_data.is_active is not None:
        user.is_active = update_data.is_active

    user.updated_at = datetime.utcnow()
    return {"success": True, "user": user}


@router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(admin_user: User = Depends(get_admin_user)):
    return list(in_memory_orders.values())


@router.get("/admin/revenue")
async def get_revenue(admin_user: User = Depends(get_admin_user)):
    succeeded_orders = [o for o in in_memory_orders.values() if o.status == "succeeded"]
    total_revenue = sum(o.amount for o in succeeded_orders)

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
        "total_orders": len(in_memory_orders),
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

    now = datetime.utcnow()
    withdrawal = WithdrawalRequest(
        id=str(uuid.uuid4()),
        admin_id=admin_user.id,
        admin_email=admin_user.email,
        amount=withdrawal_data.amount,
        payment_method=withdrawal_data.payment_method,
        status="pending",
        notes=withdrawal_data.notes,
        created_at=now,
        updated_at=now,
    )
    in_memory_withdrawals[withdrawal.id] = withdrawal
    return {"success": True, "withdrawal": withdrawal}


@router.get("/admin/withdrawals", response_model=List[WithdrawalRequest])
async def get_withdrawals(admin_user: User = Depends(get_admin_user)):
    return list(in_memory_withdrawals.values())


@router.patch("/admin/withdrawals/{withdrawal_id}")
async def update_withdrawal(
    withdrawal_id: str,
    update_data: WithdrawalRequestUpdate,
    admin_user: User = Depends(get_admin_user),
):
    withdrawal = in_memory_withdrawals.get(withdrawal_id)
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")

    if update_data.status:
        withdrawal.status = update_data.status
    if update_data.notes:
        withdrawal.notes = update_data.notes
    withdrawal.updated_at = datetime.utcnow()
    return {"success": True, "withdrawal": withdrawal}
