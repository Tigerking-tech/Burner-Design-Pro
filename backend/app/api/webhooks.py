"""
Creem Webhook Handler
Handles subscription and payment events from Creem.

Key events we handle:
  - subscription.created
  - subscription.activated
  - subscription.cancelled
  - subscription.expired
  - payment.completed
  - payment.refunded

Endpoint to register in Creem dashboard:
  https://<your-domain>/api/webhooks/creem
"""
from fastapi import APIRouter, Request, HTTPException, status
from typing import Optional, Dict, Any
import os
import json
from datetime import datetime, timedelta

from app.services.creem_client import CreemClient
from app.services.database import (
    get_user_by_id, get_user_by_email,
    list_orders, update_order_status,
    update_user_subscription, update_user_creem,
    user_exists,
)

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_user_from_payload(payload: Dict[str, Any]):
    """
    Try to resolve a user dict from an incoming Creem webhook payload.
    Lookup order:
      1. metadata.user_id in the payload
      2. attributes.customer_email / metadata.user_email
      3. email field
    """
    data = payload.get("data") or {}
    metadata = data.get("metadata") or {}

    user_id = metadata.get("user_id")
    if user_id:
        user = get_user_by_id(user_id)
        if user:
            return user

    attrs = data.get("attributes") or {}
    email = (
        metadata.get("user_email")
        or attrs.get("customer_email")
        or attrs.get("email")
    )
    if email:
        user = get_user_by_email(email.lower())
        if user:
            return user

    return None


def _get_subscription_id(payload: Dict[str, Any]) -> Optional[str]:
    data = payload.get("data") or {}
    return data.get("subscription_id") or data.get("id")


def _activate_pro_tier(user_dict: Dict[str, Any], valid_days: int = 30) -> None:
    update_user_subscription(
        user_id=user_dict["id"],
        tier="pro",
        expires_at=datetime.utcnow() + timedelta(days=valid_days),
        is_active=True,
    )


def _downgrade_user(user_dict: Dict[str, Any]) -> None:
    update_user_subscription(
        user_id=user_dict["id"],
        tier="free",
        expires_at=None,
        is_active=True,
    )


def _mark_order_succeeded(user_dict: Dict[str, Any]) -> None:
    """Find pending orders for this user and mark them as succeeded."""
    orders = list_orders()
    for o in orders:
        if o["user_id"] == user_dict["id"] and o["status"] == "pending":
            update_order_status(o["id"], "succeeded")


def _mark_order_refunded(user_dict: Dict[str, Any]) -> None:
    """Find succeeded orders for this user and mark them as refunded."""
    orders = list_orders()
    for o in orders:
        if o["user_id"] == user_dict["id"] and o["status"] == "succeeded":
            update_order_status(o["id"], "refunded")


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

    print(f"[webhooks] ========================================")
    print(f"[webhooks] Received Creem event: {event_type}")
    print(f"[webhooks] Full payload keys: {list(payload.keys())}")
    print(f"[webhooks] Data keys: {list(data.keys())}")
    if data.get("metadata"):
        print(f"[webhooks] Metadata: {data.get('metadata')}")

    user_dict = _get_user_from_payload(payload)
    sub_id = _get_subscription_id(payload)

    print(f"[webhooks] Resolved user: {user_dict['email'] if user_dict else 'NOT FOUND'}")
    print(f"[webhooks] Subscription ID: {sub_id or 'N/A'}")

    # Save customer id / subscription id on user if provided
    customer_id = data.get("customer_id")
    if user_dict and customer_id:
        update_user_creem(user_dict["id"], creem_customer_id=str(customer_id))

    # ------------------------------------------------------------------
    # Subscription created / activated / paid
    # ------------------------------------------------------------------
    if event_type in (
        "subscription.created",
        "subscription.activated",
        "subscription.active",
        "subscription.renewed",
        "subscription.paid",
        "payment.completed",
        "payment.succeeded",
        "checkout.completed",
    ):
        if not user_dict:
            print(f"[webhooks] {event_type}: user not found")
            return {"success": True, "message": "User not found (no-op)"}

        _activate_pro_tier(user_dict, valid_days=365)
        if sub_id:
            update_user_creem(user_dict["id"], creem_subscription_id=str(sub_id))
        _mark_order_succeeded(user_dict)
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
        if not user_dict:
            print(f"[webhooks] {event_type}: user not found")
            return {"success": True, "message": "User not found (no-op)"}

        _downgrade_user(user_dict)
        return {"success": True, "message": f"Handled {event_type}"}

    # ------------------------------------------------------------------
    # Refund
    # ------------------------------------------------------------------
    if event_type in ("payment.refunded", "payment.failed"):
        if user_dict:
            _downgrade_user(user_dict)
            _mark_order_refunded(user_dict)
        return {"success": True, "message": f"Handled {event_type}"}

    # ------------------------------------------------------------------
    # Ignored events
    # ------------------------------------------------------------------
    print(f"[webhooks] Ignored Creem event: {event_type}")
    return {"success": True, "message": "Event not handled"}
