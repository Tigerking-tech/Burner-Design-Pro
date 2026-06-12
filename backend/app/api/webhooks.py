"""
Paddle Webhook Handler
Handles subscription and transaction events from Paddle Billing.

Paddle webhook reference:
  https://developer.paddle.com/webhooks/overview

Payload:
  {
    "event_id": "...",
    "event_type": "subscription.activated",  # transaction.completed, etc.
    "occurred_at": "2024-01-01T00:00:00.000Z",
    "notification_id": "...",
    "data": {
        "id": "txn_xxx" or "sub_xxx",
        "type": "transaction" | "subscription" | "customer",
        "attributes": { ... },
        "custom_data": { "user_id": "...", "tier": "pro", ... },
        ...
    }
  }

Signature header:
  Paddle-Signature: ts=1700000000;h1=<hex-hmac-sha256>

Endoint to register in Paddle dashboard:
  https://<your-domain>/api/webhooks/paddle

Key events we care about:
  - transaction.completed         — user paid for a subscription (initial/renewal)
  - subscription.activated         — subscription becomes active
  - subscription.updated (when status becomes cancelled)
  - subscription.canceled         — subscription scheduled to cancel
  - subscription.past_due         — payment failed
  - subscription.paused           — subscription paused
"""
from fastapi import APIRouter, Request, HTTPException, status
from typing import Optional, Dict, Any
import os
import json
from datetime import datetime, timedelta

from app.models.user import (
    User,
    in_memory_users,
    in_memory_orders,
    email_to_user_id,
)
from app.services.paddle_client import PaddleClient

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_user_from_payload(payload: Dict[str, Any]) -> Optional[User]:
    """
    Try to resolve a User from an incoming Paddle webhook payload.

    Resolution order:
      1. data.custom_data.user_id  (we set this at checkout creation)
      2. data.custom_data.user_email
      3. data.attributes.email / data.attributes.customer_id
    """
    data = payload.get("data") or {}
    custom = data.get("custom_data") or {}
    attrs = data.get("attributes") or {}

    # 1) user_id from custom_data
    user_id = custom.get("user_id")
    if user_id and user_id in in_memory_users:
        return in_memory_users[user_id]

    # 2) email from custom_data or transaction attributes
    email = custom.get("user_email") or attrs.get("email")
    if email:
        uid = email_to_user_id.get(email.lower())
        if uid and uid in in_memory_users:
            return in_memory_users[uid]

    # 3) email from customer section on transactions
    customer = attrs.get("customer") or {}
    if isinstance(customer, dict):
        email = customer.get("email")
        if email:
            uid = email_to_user_id.get(email.lower())
            if uid and uid in in_memory_users:
                return in_memory_users[uid]

    return None


def _get_subscription_id(payload: Dict[str, Any]) -> Optional[str]:
    """Extract the subscription ID (sub_xxx) from a webhook payload."""
    data = payload.get("data") or {}

    # For subscription.* events — data.id is the subscription id
    event_type = payload.get("event_type", "")
    if event_type.startswith("subscription."):
        sub_id = data.get("id")
        if sub_id:
            return str(sub_id)

    # For transaction.* events — find subscription_id inside items/attributes
    attrs = data.get("attributes") or {}
    items = attrs.get("items") or []
    if isinstance(items, list):
        for it in items:
            sub_id = (it.get("price") or {}).get("product_id") or it.get(
                "subscription_id"
            )
            if sub_id and str(sub_id).startswith("sub_"):
                return str(sub_id)

    # Some webhooks have subscription_id at the top-level of attributes
    return attrs.get("subscription_id")


def _activate_pro_tier(user: User, valid_days: int = 30) -> None:
    now = datetime.utcnow()
    user.subscription_tier = "pro"
    user.subscription_expires_at = now + timedelta(days=valid_days)
    user.updated_at = now


def _downgrade_user(user: User) -> None:
    user.subscription_tier = "free"
    user.subscription_expires_at = None
    user.updated_at = datetime.utcnow()


def _mark_order_succeeded(user: User) -> None:
    for order in in_memory_orders.values():
        if order.user_id == user.id and order.status == "pending":
            order.status = "succeeded"
            order.updated_at = datetime.utcnow()


def _mark_order_refunded(user: User) -> None:
    for order in in_memory_orders.values():
        if order.user_id == user.id and order.status == "succeeded":
            order.status = "refunded"
            order.updated_at = datetime.utcnow()


# ---------------------------------------------------------------------------
# Webhook handler
# ---------------------------------------------------------------------------
@router.post("/paddle")
async def paddle_webhook(request: Request):
    """
    Public endpoint receiving signed webhooks from Paddle.
    """
    webhook_secret = os.getenv("PADDLE_WEBHOOK_SECRET", "").strip()
    signature = request.headers.get("paddle-signature") or request.headers.get(
        "Paddle-Signature"
    )
    body = await request.body()

    # Signature verification
    if webhook_secret:
        if not signature or not PaddleClient.verify_webhook_signature(
            body, signature, webhook_secret
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature",
            )
    else:
        print(
            "[webhooks] WARNING: PADDLE_WEBHOOK_SECRET is not set; "
            "accepting webhook without verification."
        )

    try:
        payload = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )

    event_type = payload.get("event_type")
    data = payload.get("data") or {}
    attrs = data.get("attributes") or {}

    print(f"[webhooks] Received Paddle event: {event_type}")

    user = _get_user_from_payload(payload)
    sub_id = _get_subscription_id(payload)

    # ------------------------------------------------------------------
    # Transaction completed — user just paid / renewed
    # ------------------------------------------------------------------
    if event_type == "transaction.completed":
        if not user:
            print(f"[webhooks] {event_type}: user not found")
            return {"success": True, "message": "User not found (no-op)"}

        # Activate / extend pro tier
        _activate_pro_tier(user, valid_days=30)
        if sub_id:
            user.paddle_subscription_id = sub_id
        # Also attach transaction id if we can match to an order
        txn_id = data.get("id")
        for order in in_memory_orders.values():
            if order.user_id == user.id and order.status == "pending":
                order.paddle_transaction_id = txn_id
        _mark_order_succeeded(user)
        return {"success": True, "message": f"Handled {event_type}"}

    # ------------------------------------------------------------------
    # Subscription activated / updated (e.g. status -> active)
    # ------------------------------------------------------------------
    if event_type in ("subscription.activated", "subscription.updated"):
        if not user:
            print(f"[webhooks] {event_type}: user not found")
            return {"success": True, "message": "User not found (no-op)"}

        status_val = attrs.get("status") or attrs.get("scheduled_change", {}).get(
            "action"
        )
        if status_val in ("canceled", "cancelled", "expired", "past_due", "paused", "inactive"):
            _downgrade_user(user)
        else:
            _activate_pro_tier(user, valid_days=30)
            if sub_id:
                user.paddle_subscription_id = sub_id
            _mark_order_succeeded(user)
        return {"success": True, "message": f"Handled {event_type}"}

    # ------------------------------------------------------------------
    # Subscription cancelled
    # ------------------------------------------------------------------
    if event_type in ("subscription.canceled", "subscription.cancelled"):
        # Paddle notifies when a cancellation is scheduled; we keep Pro
        # access until the end of the billing period, but record the id
        # so the user can manage through Paddle.
        if user and sub_id:
            user.paddle_subscription_id = sub_id
        return {"success": True, "message": f"Handled {event_type}"}

    # ------------------------------------------------------------------
    # Subscription past due / paused / expired
    # ------------------------------------------------------------------
    if event_type in (
        "subscription.past_due",
        "subscription.paused",
        "subscription.expired",
    ):
        if user:
            _downgrade_user(user)
        return {"success": True, "message": f"Handled {event_type}"}

    # ------------------------------------------------------------------
    # Transaction refunded
    # ------------------------------------------------------------------
    if event_type == "transaction.refunded":
        if user:
            _downgrade_user(user)
            _mark_order_refunded(user)
        return {"success": True, "message": f"Handled {event_type}"}

    # ------------------------------------------------------------------
    # Ignored events (customer.created, updated, etc.)
    # ------------------------------------------------------------------
    print(f"[webhooks] Ignored Paddle event: {event_type}")
    return {"success": True, "message": "Event not handled"}
