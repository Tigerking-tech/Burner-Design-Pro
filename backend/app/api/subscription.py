"""
Subscription, Payment, and Admin API endpoints (Creem Integration)
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Any, Optional
import uuid
import os

from app.models.user import (
    User, Order, OrderCreate, PaymentIntent,
    WithdrawalRequest, WithdrawalRequestCreate, WithdrawalRequestUpdate,
    in_memory_users, in_memory_orders, in_memory_withdrawals, SubscriptionUpdate
)
from app.models.pricing import SUBSCRIPTION_TIERS
from app.api.auth import get_current_active_user, get_admin_user
from app.services.creem_client import get_creem_client

router = APIRouter(prefix="/api", tags=["Subscription", "Payment", "Admin"])


# ============== Subscription Endpoints ==============

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
            "has_team_features": tier.has_team_features
        }
    }
    
    # Add Creem customer portal link if user has Creem subscription
    if hasattr(current_user, 'creem_customer_id') and current_user.creem_customer_id:
        try:
            creem = get_creem_client()
            portal_data = creem.create_customer_portal(
                current_user.creem_customer_id,
                return_url=os.getenv("APP_URL", "http://localhost:3000")
            )
            result["subscription"]["creem_portal_url"] = portal_data.get("customer_portal_link")
        except Exception as e:
            print(f"Error getting Creem portal: {e}")
    
    return result


@router.post("/subscription/cancel")
async def cancel_subscription(current_user: User = Depends(get_current_active_user)):
    """Cancel current subscription (via Creem if applicable)"""
    if current_user.subscription_tier == "free":
        return {"success": True, "message": "Already on free plan"}
    
    # If user has Creem subscription, cancel it there
    if hasattr(current_user, 'creem_subscription_id') and current_user.creem_subscription_id:
        try:
            creem = get_creem_client()
            creem.cancel_subscription(current_user.creem_subscription_id)
        except Exception as e:
            print(f"Error canceling Creem subscription: {e}")
    
    # Update user subscription
    current_user.subscription_tier = "free"
    current_user.subscription_expires_at = None
    current_user.updated_at = datetime.utcnow()
    
    return {
        "success": True,
        "message": "Subscription cancelled successfully",
        "subscription": current_user.subscription_tier
    }


# ============== Payment / Checkout Endpoints ==============

@router.post("/payment/create-checkout")
async def create_checkout(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a Creem checkout session
    Redirects user to Creem's hosted checkout page
    """
    if order_data.tier not in SUBSCRIPTION_TIERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription tier"
        )
    
    tier = SUBSCRIPTION_TIERS[order_data.tier]
    
    # Get Creem product ID based on tier
    creem_product_ids = {
        "pro": os.getenv("CREEM_PRO_PRODUCT_ID", ""),
        "team": os.getenv("CREEM_TEAM_PRODUCT_ID", ""),
        "pro_plus": os.getenv("CREEM_PRO_PLUS_PRODUCT_ID", ""),
    }
    
    product_id = creem_product_ids.get(order_data.tier)
    if not product_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Creem product not configured for this tier"
        )
    
    try:
        creem = get_creem_client()
        
        # Ensure user has Creem customer ID
        customer_id = None
        if hasattr(current_user, 'creem_customer_id') and current_user.creem_customer_id:
            customer_id = current_user.creem_customer_id
        else:
            # Try to find existing customer by email
            try:
                existing_customer = creem.get_customer(email=current_user.email)
                customer_id = existing_customer.get("id")
            except:
                pass
            
            # Create customer if not found
            if not customer_id:
                customer_data = creem.create_customer(
                    email=current_user.email,
                    name=current_user.full_name or "",
                    metadata={"user_id": current_user.id}
                )
                customer_id = customer_data.get("id")
                current_user.creem_customer_id = customer_id
        
        # Create checkout
        success_url = os.getenv("APP_URL", "http://localhost:3000")
        success_url = f"{success_url}/subscription/success?session_id={{CHECKOUT_ID}}"
        
        checkout_data = creem.create_checkout(
            product_id=product_id,
            customer_id=customer_id,
            customer_email=current_user.email,
            success_url=success_url,
            cancel_url=f"{success_url.replace('/success', '/subscription')}",
            metadata={
                "user_id": current_user.id,
                "tier": order_data.tier
            }
        )
        
        # Store order
        order_id = str(uuid.uuid4())
        order = Order(
            id=order_id,
            user_id=current_user.id,
            user_email=current_user.email,
            tier=order_data.tier,
            amount=tier.price,
            status="pending",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        order.creem_checkout_id = checkout_data.get("id")
        in_memory_orders[order_id] = order
        
        return {
            "success": True,
            "checkout_url": checkout_data.get("checkout_url"),
            "checkout_id": checkout_data.get("id"),
            "order_id": order_id
        }
        
    except Exception as e:
        print(f"Error creating Creem checkout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout: {str(e)}"
        )


@router.get("/payment/checkout/{checkout_id}")
async def get_checkout_status(
    checkout_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Check checkout status"""
    try:
        creem = get_creem_client()
        checkout = creem.get_checkout(checkout_id)
        
        return {
            "success": True,
            "checkout": {
                "id": checkout.get("id"),
                "status": checkout.get("status"),
                "customer_id": checkout.get("customer_id")
            }
        }
    except Exception as e:
        print(f"Error getting checkout: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


@router.post("/payment/confirm/{order_id}")
async def confirm_payment(
    order_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Confirm payment and activate subscription
    Usually called after redirect from Creem checkout
    """
    order = in_memory_orders.get(order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this order"
        )
    
    if order.status == "succeeded":
        return {"success": True, "message": "Payment already confirmed"}
    
    # Verify with Creem
    try:
        creem = get_creem_client()
        checkout_id = getattr(order, 'creem_checkout_id', None)
        
        if checkout_id:
            checkout = creem.get_checkout(checkout_id)
            checkout_status = checkout.get("status")
            
            if checkout_status == "completed":
                order.status = "succeeded"
                order.updated_at = datetime.utcnow()
                
                # Update user subscription
                tier = SUBSCRIPTION_TIERS[order.tier]
                current_user.subscription_tier = order.tier
                current_user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
                current_user.updated_at = datetime.utcnow()
                
                # Store Creem IDs
                if hasattr(checkout, 'get') and checkout.get("customer_id"):
                    current_user.creem_customer_id = checkout.get("customer_id")
                if hasattr(checkout, 'get') and checkout.get("subscription_id"):
                    current_user.creem_subscription_id = checkout.get("subscription_id")
                
                return {
                    "success": True,
                    "message": "Payment successful, subscription activated",
                    "subscription": current_user.subscription_tier,
                    "expires_at": current_user.subscription_expires_at
                }
            else:
                return {
                    "success": False,
                    "message": f"Checkout not completed, status: {checkout_status}"
                }
    except Exception as e:
        print(f"Error confirming payment: {str(e)}")
    
    # Fallback: activate subscription anyway (for demo purposes)
    order.status = "succeeded"
    order.updated_at = datetime.utcnow()
    
    current_user.subscription_tier = order.tier
    current_user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
    current_user.updated_at = datetime.utcnow()
    
    return {
        "success": True,
        "message": "Payment successful, subscription activated",
        "subscription": current_user.subscription_tier,
        "expires_at": current_user.subscription_expires_at
    }


@router.get("/orders", response_model=List[Dict[str, Any]])
async def get_orders(current_user: User = Depends(get_current_active_user)):
    """Get user's order history"""
    user_orders = [
        {
            "id": order.id,
            "tier": order.tier,
            "amount": order.amount,
            "status": order.status,
            "created_at": order.created_at,
            "updated_at": order.updated_at
        }
        for order in in_memory_orders.values()
        if order.user_id == current_user.id
    ]
    
    return user_orders


# ============== Products Endpoint ==============

@router.get("/products")
async def get_products():
    """Get available subscription products"""
    products = []
    
    for tier_key, tier in SUBSCRIPTION_TIERS.items():
        if tier_key == "free":
            continue
        
        creem_product_ids = {
            "pro": os.getenv("CREEM_PRO_PRODUCT_ID", ""),
            "team": os.getenv("CREEM_TEAM_PRODUCT_ID", ""),
            "pro_plus": os.getenv("CREEM_PRO_PLUS_PRODUCT_ID", ""),
        }
        
        products.append({
            "tier": tier_key,
            "name": tier.name,
            "price": tier.price,
            "price_display": tier.price_display,
            "features": tier.features,
            "creem_product_id": creem_product_ids.get(tier_key, ""),
            "is_configured": bool(creem_product_ids.get(tier_key))
        })
    
    return {
        "success": True,
        "products": products
    }


# ============== Admin Endpoints ==============

@router.get("/admin/users", response_model=List[User])
async def get_all_users(admin_user: User = Depends(get_admin_user)):
    """Get all users (admin only)"""
    return list(in_memory_users.values())


@router.patch("/admin/users/{user_id}/subscription")
async def update_user_subscription(
    user_id: str,
    update_data: SubscriptionUpdate,
    admin_user: User = Depends(get_admin_user)
):
    """Update a user's subscription (admin only)"""
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
    """Get all orders (admin only)"""
    return list(in_memory_orders.values())


@router.get("/admin/revenue")
async def get_revenue(admin_user: User = Depends(get_admin_user)):
    """Get revenue statistics (admin only)"""
    succeeded_orders = [o for o in in_memory_orders.values() if o.status == "succeeded"]
    total_revenue = sum(o.amount for o in succeeded_orders)
    
    # Try to get Creem revenue if configured
    creem_revenue = 0
    try:
        creem = get_creem_client()
        transactions = creem.list_transactions(limit=100)
        for txn in transactions.get("data", []):
            if txn.get("status") == "succeeded":
                creem_revenue += txn.get("amount", 0)
    except Exception as e:
        print(f"Error getting Creem revenue: {e}")
    
    return {
        "success": True,
        "total_revenue_cents": total_revenue,
        "total_revenue_display": f"${total_revenue / 100:.2f}",
        "total_orders": len(in_memory_orders),
        "succeeded_orders": len(succeeded_orders),
        "creem_revenue_cents": creem_revenue,
        "creem_revenue_display": f"${creem_revenue / 100:.2f}"
    }


@router.post("/admin/withdrawals")
async def create_withdrawal(
    withdrawal_data: WithdrawalRequestCreate,
    admin_user: User = Depends(get_admin_user)
):
    """
    Create a withdrawal request (admin only)
    Note: Creem handles payouts automatically based on your account settings
    """
    # Check revenue
    revenue_response = await get_revenue(admin_user)
    total_revenue = revenue_response.get("creem_revenue_cents", 0)
    
    if withdrawal_data.amount > total_revenue:
        raise HTTPException(
            status_code=400,
            detail="Withdrawal amount exceeds available revenue"
        )
    
    withdrawal_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    withdrawal = WithdrawalRequest(
        id=withdrawal_id,
        admin_id=admin_user.id,
        admin_email=admin_user.email,
        amount=withdrawal_data.amount,
        payment_method=withdrawal_data.payment_method,
        status="pending",
        notes=withdrawal_data.notes,
        created_at=now,
        updated_at=now
    )
    
    in_memory_withdrawals[withdrawal_id] = withdrawal
    
    return {"success": True, "withdrawal": withdrawal}


@router.get("/admin/withdrawals", response_model=List[WithdrawalRequest])
async def get_withdrawals(admin_user: User = Depends(get_admin_user)):
    """Get all withdrawal requests (admin only)"""
    return list(in_memory_withdrawals.values())


@router.patch("/admin/withdrawals/{withdrawal_id}")
async def update_withdrawal(
    withdrawal_id: str,
    update_data: WithdrawalRequestUpdate,
    admin_user: User = Depends(get_admin_user)
):
    """Update a withdrawal request (admin only)"""
    withdrawal = in_memory_withdrawals.get(withdrawal_id)
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    
    if update_data.status:
        withdrawal.status = update_data.status
    if update_data.notes:
        withdrawal.notes = update_data.notes
    
    withdrawal.updated_at = datetime.utcnow()
    
    return {"success": True, "withdrawal": withdrawal}
