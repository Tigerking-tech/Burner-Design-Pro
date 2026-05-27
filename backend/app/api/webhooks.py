"""
Creem Webhook Handler
Handles subscription events from Creem
"""
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import json

from app.models.user import in_memory_users
from app.services.creem_client import get_creem_client

router = APIRouter(prefix="/api/webhooks/creem", tags=["Creem Webhooks"])


class CreemWebhookEvent(BaseModel):
    """Webhook event model"""
    event: str
    object: Dict[str, Any]


def get_user_by_creem_customer_id(customer_id: str):
    """Find user by Creem customer ID"""
    for user in in_memory_users.values():
        if hasattr(user, 'creem_customer_id') and user.creem_customer_id == customer_id:
            return user
    return None


def get_user_by_email(email: str):
    """Find user by email"""
    for user in in_memory_users.values():
        if user.email == email:
            return user
    return None


async def handle_checkout_completed(event_data: Dict[str, Any]):
    """Handle checkout.completed event"""
    checkout = event_data.get("object", {})
    customer_id = checkout.get("customer_id")
    customer_email = checkout.get("customer_email")
    product_id = checkout.get("product_id")
    
    # Find user
    user = None
    if customer_id:
        user = get_user_by_creem_customer_id(customer_id)
    if not user and customer_email:
        user = get_user_by_email(customer_email)
    
    if not user:
        print(f"Webhook: User not found for checkout {checkout.get('id')}")
        return {"success": False, "message": "User not found"}
    
    # Map Creem product to subscription tier
    # You need to configure this mapping based on your Creem products
    tier_mapping = {
        os.getenv("CREEM_PRO_PRODUCT_ID", ""): "pro",
        os.getenv("CREEM_TEAM_PRODUCT_ID", ""): "team",
        os.getenv("CREEM_PRO_PLUS_PRODUCT_ID", ""): "pro_plus",
    }
    
    tier = tier_mapping.get(product_id, "pro")
    
    # Update user subscription
    from datetime import datetime, timedelta
    user.subscription_tier = tier
    user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
    user.updated_at = datetime.utcnow()
    
    # Store Creem customer ID if not already stored
    if customer_id and not hasattr(user, 'creem_customer_id'):
        user.creem_customer_id = customer_id
    
    # Store Creem subscription ID if available
    if "subscription_id" in checkout:
        user.creem_subscription_id = checkout["subscription_id"]
    
    print(f"Webhook: Activated {tier} subscription for {user.email}")
    return {"success": True, "message": f"Subscription {tier} activated"}


async def handle_subscription_active(event_data: Dict[str, Any]):
    """Handle subscription.active event"""
    subscription = event_data.get("object", {})
    customer_id = subscription.get("customer_id")
    product_id = subscription.get("product_id")
    
    user = get_user_by_creem_customer_id(customer_id)
    if not user:
        # Try to find by iterating users and checking their email in subscription
        print(f"Webhook: User not found for subscription {subscription.get('id')}")
        return {"success": False, "message": "User not found"}
    
    # Map product to tier
    tier_mapping = {
        os.getenv("CREEM_PRO_PRODUCT_ID", ""): "pro",
        os.getenv("CREEM_TEAM_PRODUCT_ID", ""): "team",
        os.getenv("CREEM_PRO_PLUS_PRODUCT_ID", ""): "pro_plus",
    }
    
    tier = tier_mapping.get(product_id, "pro")
    
    from datetime import datetime, timedelta
    user.subscription_tier = tier
    user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
    user.updated_at = datetime.utcnow()
    user.creem_subscription_id = subscription.get("id")
    
    print(f"Webhook: Activated subscription for {user.email}")
    return {"success": True}


async def handle_subscription_canceled(event_data: Dict[str, Any]):
    """Handle subscription.canceled event"""
    subscription = event_data.get("object", {})
    customer_id = subscription.get("customer_id")
    
    user = get_user_by_creem_customer_id(customer_id)
    if not user:
        print(f"Webhook: User not found for cancellation")
        return {"success": False}
    
    # Downgrade to free
    user.subscription_tier = "free"
    user.subscription_expires_at = None
    user.updated_at = __import__('datetime').datetime.utcnow()
    
    print(f"Webhook: Canceled subscription for {user.email}")
    return {"success": True}


async def handle_subscription_paid(event_data: Dict[str, Any]):
    """Handle subscription.paid event (recurring payment successful)"""
    subscription = event_data.get("object", {})
    customer_id = subscription.get("customer_id")
    
    user = get_user_by_creem_customer_id(customer_id)
    if not user:
        print(f"Webhook: User not found for payment")
        return {"success": False}
    
    from datetime import datetime, timedelta
    # Extend subscription
    if user.subscription_expires_at:
        user.subscription_expires_at = user.subscription_expires_at + timedelta(days=30)
    else:
        user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
    
    user.updated_at = datetime.utcnow()
    
    print(f"Webhook: Extended subscription for {user.email}")
    return {"success": True}


async def handle_subscription_past_due(event_data: Dict[str, Any]):
    """Handle subscription.past_due event"""
    subscription = event_data.get("object", {})
    customer_id = subscription.get("customer_id")
    
    user = get_user_by_creem_customer_id(customer_id)
    if user:
        # Mark subscription as past due (could add a field for this)
        print(f"Webhook: Subscription past due for {user.email}")
    
    return {"success": True}


async def handle_subscription_expired(event_data: Dict[str, Any]):
    """Handle subscription.expired event"""
    subscription = event_data.get("object", {})
    customer_id = subscription.get("customer_id")
    
    user = get_user_by_creem_customer_id(customer_id)
    if user:
        user.subscription_tier = "free"
        user.subscription_expires_at = None
        user.updated_at = __import__('datetime').datetime.utcnow()
        print(f"Webhook: Subscription expired for {user.email}")
    
    return {"success": True}


EVENT_HANDLERS = {
    "checkout.completed": handle_checkout_completed,
    "subscription.active": handle_subscription_active,
    "subscription.paid": handle_subscription_paid,
    "subscription.canceled": handle_subscription_canceled,
    "subscription.past_due": handle_subscription_past_due,
    "subscription.expired": handle_subscription_expired,
}


@router.post("/webhook")
async def creem_webhook(request: Request):
    """
    Handle Creem webhook events
    """
    # Get webhook secret for verification
    webhook_secret = os.getenv("CREEM_WEBHOOK_SECRET", "")
    
    # Get signature from headers
    signature = request.headers.get("creem-signature", "")
    
    # Get raw body
    body = await request.body()
    body_str = body.decode("utf-8") if isinstance(body, bytes) else body
    
    # Verify signature (skip in test mode)
    if webhook_secret and os.getenv("CREEM_TEST_MODE", "true").lower() != "true":
        from app.services.creem_client import CreemClient
        if not CreemClient.verify_webhook(body_str, signature, webhook_secret):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature"
            )
    
    # Parse event
    try:
        event_data = json.loads(body_str)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )
    
    event_type = event_data.get("event")
    
    # Log received event
    print(f"Creem Webhook: Received {event_type}")
    
    # Handle event
    handler = EVENT_HANDLERS.get(event_type)
    if handler:
        try:
            result = await handler(event_data)
            return result
        except Exception as e:
            print(f"Error handling webhook event {event_type}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing event: {str(e)}"
            )
    else:
        print(f"Creem Webhook: Unhandled event type {event_type}")
        return {"success": True, "message": "Event type not handled"}
