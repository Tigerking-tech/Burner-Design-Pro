"""
Lemon Squeezy Webhook Handler
Handles subscription, order, and checkout events from Lemon Squeezy.

Payload reference: https://docs.lemonsqueezy.com/api/webhooks

Key events:
  - subscription_created
  - subscription_updated
  - subscription_cancelled
  - subscription_expired
  - order_created
  - order_refunded

The webhook payload is always a JSON:API document under `data` with nested
`attributes`. The user id / email we pass as custom data lives in
`meta.custom_data`.
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
from app.services.lemon_squeezy_client import LemonSqueezyClient

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_user_from_payload(payload: Dict[str, Any]) -> Optional[User]:
    """
    Try to resolve a User from an incoming webhook payload.

    Resolution order:
      1. ``meta.custom_data.user_id`` (attached at checkout creation time)
      2. ``data.attributes.user_email`` (for orders)
      3. ``data.attributes.user_name`` / look up email via LS API if available
    """
    meta = payload.get("meta") or {}
    custom = meta.get("custom_data") or {}
    user_id = custom.get("user_id")

    if user_id and user_id in in_memory_users:
        return in_memory_users[user_id]

    # Fall back to the user's email on the order / subscription
    attrs = (payload.get("data") or {}).get("attributes") or {}
    email = attrs.get("user_email") or custom.get("user_email")
    if email:
        uid = email_to_user_id.get(email.lower())
        if uid and uid in in_memory_users:
            return in_memory_users[uid]

    return None


def _get_order_from_payload(payload: Dict[str, Any]) -> Optional[Any]:
    """
    Orders carry the Lemon Squeezy ``identifier`` but our checkout session ids
    are stored on orders differently. For our needs we look up locally by the
    checkout identifier we get on an order's ``first_order_item`` / via
    ``attributes.checkout_id`` (LS does not include it directly but sometimes
    ``identifier`` on order matches the checkout id from the checkout payload).
    We fall back to the LS subscription id / order id stored by user.
    """
    attrs = (payload.get("data") or {}).get("attributes") or {}
    identifier = attrs.get("identifier") or attrs.get("order_number")
    subscription_id = attrs.get("subscription_id")

    for order in in_memory_orders.values():
        if identifier and getattr(order, "ls_checkout_id", None) == str(identifier):
            return order
        if (
            subscription_id
            and getattr(order, "ls_order_id", None) == str(subscription_id)
        ):
            return order

    return None


def _update_user_pro(user: User, valid_days: int = 30) -> None:
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
@router.post("/lemon-squeezy")
async def lemon_squeezy_webhook(request: Request):
    """
    Public endpoint receiving signed webhooks from Lemon Squeezy.

    Lemon Squeezy sends:
      - ``X-Signature`` header (HMAC-SHA256 hex of raw body using signing secret)
      - JSON body containing the event metadata and affected resource
    """
    webhook_secret = os.getenv("LEMON_SQUEEZY_WEBHOOK_SECRET", "").strip()
    signature = request.headers.get("x-signature") or request.headers.get(
        "X-Signature"
    )
    body = await request.body()

    # Signature verification (skip in development if secret not configured)
    if webhook_secret:
        if not signature or not LemonSqueezyClient.verify_webhook_signature(
            body, signature, webhook_secret
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature",
            )
    else:
        print(
            "[webhooks] WARNING: LEMON_SQUEEZY_WEBHOOK_SECRET is not set; "
            "accepting webhook without verification."
        )

    try:
        payload = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )

    meta = payload.get("meta") or {}
    event_name = meta.get("event_name")
    data = payload.get("data") or {}
    attrs = data.get("attributes") or {}

    print(f"[webhooks] Received LS event: {event_name}")

    user = _get_user_from_payload(payload)

    # ------------------------------------------------------------------
    # Subscription events
    # ------------------------------------------------------------------
    if event_name in (
        "subscription_created",
        "subscription_updated",
        "subscription_paused",
    ):
        if not user:
            print(f"[webhooks] {event_name}: user not found")
            return {"success": True, "message": "User not found (no-op)"}

        status_val = attrs.get("status")
        # LS statuses: active, cancelled, expired, past_due, unpaid, paused
        if status_val in ("cancelled", "expired", "past_due", "unpaid", "paused"):
            _downgrade_user(user)
        else:
            # Activate / extend for the current billing cycle
            _update_user_pro(user, valid_days=30)
            # Persist LS subscription id on user for later portal lookups
            sub_id = data.get("id")
            if sub_id:
                user.ls_subscription_id = str(sub_id)
            _mark_order_succeeded(user)
        return {"success": True, "message": f"Handled {event_name}"}

    if event_name == "subscription_cancelled":
        # At end-of-term cancellation; keep Pro until expires
        if user:
            sub_id = data.get("id")
            if sub_id:
                user.ls_subscription_id = str(sub_id)
        return {"success": True, "message": f"Handled {event_name}"}

    if event_name == "subscription_expired":
        if user:
            _downgrade_user(user)
        return {"success": True, "message": f"Handled {event_name}"}

    # ------------------------------------------------------------------
    # Order events
    # ------------------------------------------------------------------
    if event_name == "order_created":
        if not user:
            print(f"[webhooks] {event_name}: user not found")
            return {"success": True, "message": "User not found (no-op)"}

        order_status = attrs.get("status")  # paid, pending, refunded
        if order_status == "paid":
            _update_user_pro(user, valid_days=30)
            _mark_order_succeeded(user)
            sub_id = attrs.get("subscription_id") or data.get("id")
            if sub_id:
                user.ls_subscription_id = str(sub_id)
        return {"success": True, "message": f"Handled {event_name}"}

    if event_name == "order_refunded":
        if user:
            _downgrade_user(user)
            _mark_order_refunded(user)
        return {"success": True, "message": f"Handled {event_name}"}

    # ------------------------------------------------------------------
    # Ignored events
    # ------------------------------------------------------------------
    print(f"[webhooks] Ignored LS event: {event_name}")
    return {"success": True, "message": "Event not handled"}
