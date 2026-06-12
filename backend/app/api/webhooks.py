"""
Creem Webhook Handler
Handles subscription and payment events from Creem.

Creem webhook reference: https://docs.creem.io

Key events we handle:
  - subscription.created
  - subscription.activated
  - subscription.cancelled
  - subscription.expired
  - payment.completed
  - payment.refunded

Endpoint to register in Creem dashboard:
  https://<your-domain>/api/webhooks/creem

Signature: Creem usually sends a signature header (x-creem-signature)
computed as HMAC-SHA256 of the request body using the webhook secret.
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
from app.services.creem_client import CreemClient

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_user_from_payload(payload: Dict[str, Any]) -> Optional[User]:
    """
    Try to resolve a User from an incoming Creem webhook payload.
    Lookup order:
      1. metadata.user_id in the payload
      2. attributes.customer_email / metadata.user_email
      3. email field
    """
    data = payload.get("data") or {}
    metadata = data.get("metadata") or {}

    user_id = metadata.get("user_id")
    if user_id and user_id in in_memory_users:
        return in_memory_users[user_id]

    attrs = data.get("attributes") or {}
    email = (
        metadata.get("user_email")
        or attrs.get("customer_email")
        or attrs.get("email")
    )
    if email:
        uid = email_to_user_id.get(email.lower())
        if uid and uid in in_memory_users:
            return in_memory_users[uid]

    return None


def _get_subscription_id(payload: Dict[str, Any]) -> Optional[str]:
    data = payload.get("data") or {}
    return data.get("subscription_id") or data.get("id")


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
@router.post("/creem")
async def creem_webhook(request: Request):
    """Public endpoint receiving signed webhooks from Creem."""
    webhook_secret = os.getenv("CREEM_WEBHOOK_SECRET", "").strip()
    signature = (
        request.headers.get("x-creem-signature")
        or request.headers.get("X-Creem-Signature")
    )
    body = await request.body()

    # Signature verification
    if webhook_secret:
        if not signature or not CreemClient.verify_webhook(
            body.decode("utf-8") if isinstance(body, (bytes, bytearray)) else str(body),
            signature,
            webhook_secret,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature",
            )
    else:
        print(
            "[webhooks] WARNING: CREEM_WEBHOOK_SECRET not set; accepting without verification."
        )

    try:
        payload = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )

    event_type = payload.get("event") or payload.get("event_type") or payload.get("type")
    data = payload.get("data") or {}

    print(f"[webhooks] Received Creem event: {event_type}")

    user = _get_user_from_payload(payload)
    sub_id = _get_subscription_id(payload)

    # Save customer id / subscription id on user if provided
    customer_id = data.get("customer_id")
    if user and customer_id:
        user.creem_customer_id = str(customer_id)

    # ------------------------------------------------------------------
    # Subscription created / activated
    # ------------------------------------------------------------------
    if event_type in (
        "subscription.created",
        "subscription.activated",
        "subscription.active",
        "subscription.renewed",
        "payment.completed",
        "payment.succeeded",
        "checkout.completed",
    ):
        if not user:
            print(f"[webhooks] {event_type}: user not found")
            return {"success": True, "message": "User not found (no-op)"}

        _activate_pro_tier(user, valid_days=30)
        if sub_id:
            user.creem_subscription_id = str(sub_id)
        _mark_order_succeeded(user)
        return {"success": True, "message": f"Handled {event_type}"}

    # ------------------------------------------------------------------
    # Subscription cancelled / expired / paused
    # ------------------------------------------------------------------
    if event_type in (
        "subscription.cancelled",
        "subscription.canceled",
        "subscription.paused",
        "subscription.expired",
        "subscription.past_due",
    ):
        if not user:
            print(f"[webhooks] {event_type}: user not found")
            return {"success": True, "message": "User not found (no-op)"}

        _downgrade_user(user)
        return {"success": True, "message": f"Handled {event_type}"}

    # ------------------------------------------------------------------
    # Refund
    # ------------------------------------------------------------------
    if event_type in ("payment.refunded", "payment.failed"):
        if user:
            _downgrade_user(user)
            _mark_order_refunded(user)
        return {"success": True, "message": f"Handled {event_type}"}

    # ------------------------------------------------------------------
    # Ignored events
    # ------------------------------------------------------------------
    print(f"[webhooks] Ignored Creem event: {event_type}")
    return {"success": True, "message": "Event not handled"}
