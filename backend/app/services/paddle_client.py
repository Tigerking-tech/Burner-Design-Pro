"""
Paddle API Client (Paddle Billing / Paddle v1 API)
https://developer.paddle.com/api-reference/overview

Key concepts:
  - Products contain Prices (a "price" is like a LS "variant" — specific billing cycle/amount)
  - Checkouts are created via POST /transactions → Paddle returns a `url` for hosted checkout
  - Webhooks use the Paddle-Signature header: ts=<timestamp>;h1=<hmac-sha256>
  - Customer portal (subscription management) is fetched via GET /subscriptions/<id>

Environment:
  - PADDLE_API_KEY      — API key from vendor.paddle.com
  - PADDLE_ENV          — "sandbox" or "production" (default sandbox)
  - PADDLE_WEBHOOK_SECRET — Secret for webhook signature verification
"""
import os
import httpx
import hmac
import hashlib
import json
from typing import Optional, Dict, Any


SANDBOX_URL = "https://sandbox-api.paddle.com"
PRODUCTION_URL = "https://api.paddle.com"


class PaddleClient:
    """Paddle Billing API client"""

    def __init__(self, api_key: str, environment: str = "sandbox"):
        self.api_key = api_key
        self.environment = environment.lower() if environment else "sandbox"
        self.base_url = (
            PRODUCTION_URL if self.environment == "production" else SANDBOX_URL
        )
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        self.client = httpx.Client(
            base_url=self.base_url,
            headers=self.headers,
            timeout=30.0,
        )

    # ------------------------------------------------------------------
    # Checkout — create a transaction and return the hosted checkout URL
    # ------------------------------------------------------------------
    def create_checkout(
        self,
        price_id: str,
        customer_email: Optional[str] = None,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        custom_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a Paddle Transaction, which yields a hosted checkout URL.

        :param price_id: Paddle Price ID (pri_xxx) — the Pro plan price you set up
        :param customer_email: Optional pre-filled email
        :param success_url: Redirect after successful payment
        :param cancel_url: Redirect after cancelled payment
        :param custom_data: Metadata attached to the transaction, forwarded in webhooks
        """
        items = [{"price_id": price_id, "quantity": 1}]

        payload: Dict[str, Any] = {
            "items": items,
            "collection_mode": "automatic",
            "currency_code": "USD",
            "billing_details": {},
        }

        if custom_data:
            payload["custom_data"] = custom_data

        if success_url:
            payload["success_url"] = success_url
        if cancel_url:
            payload["cancel_url"] = cancel_url

        response = self.client.post("/transactions", json=payload)
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise Exception(
                f"Paddle API Error ({e.response.status_code}): {e.response.text}"
            )

        return response.json()

    # ------------------------------------------------------------------
    # Subscriptions
    # ------------------------------------------------------------------
    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Get a subscription by ID (sub_xxx)"""
        response = self.client.get(f"/subscriptions/{subscription_id}")
        response.raise_for_status()
        return response.json()

    def cancel_subscription(
        self, subscription_id: str, effective_from: str = "next_billing_period"
    ) -> Dict[str, Any]:
        """
        Cancel a subscription.

        :param effective_from: "next_billing_period" (default) or "immediately"
        """
        payload = {"effective_from": effective_from}
        response = self.client.post(
            f"/subscriptions/{subscription_id}/cancel",
            json=payload,
        )
        response.raise_for_status()
        return response.json()

    # ------------------------------------------------------------------
    # Customer Portal (Billing URL)
    # ------------------------------------------------------------------
    def get_customer_portal_url(self, subscription_id: str) -> Optional[str]:
        """
        Paddle does not expose a generic "portal URL" per-subscription, but
        the subscription object contains an ``update_url`` and ``cancel_url``
        customers can use. For a unified "billing portal" experience we just
        return the subscription's management URL (update_url) when available.
        """
        try:
            sub = self.get_subscription(subscription_id)
            data = sub.get("data", {})
            return data.get("management_urls", {}).get(
                "update_payment_method"
            ) or data.get("management_urls", {}).get("cancel")
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Orders / receipts (for admin use)
    # ------------------------------------------------------------------
    def list_transactions(
        self, page: int = 1, per_page: int = 100
    ) -> Dict[str, Any]:
        """List recent transactions"""
        response = self.client.get(
            "/transactions",
            params={"per_page": per_page, "_page": page},
        )
        response.raise_for_status()
        return response.json()

    # ------------------------------------------------------------------
    # Webhook verification
    # ------------------------------------------------------------------
    @staticmethod
    def verify_webhook_signature(
        raw_payload: bytes,
        signature_header: str,
        webhook_secret: str,
    ) -> bool:
        """
        Verify a Paddle webhook signature.

        Paddle sends the signature in the ``Paddle-Signature`` header as:
            ``ts=<unix_ts>;h1=<hex(hmac-sha256(secret, ts + ":" + body))>``

        We compute the expected HMAC over the concatenation of:
            ``ts_str + ":" + raw_body_as_decoded_utf8``
        and compare against the ``h1=`` component of the header.
        """
        if not signature_header or not webhook_secret:
            return False

        # Parse header components
        ts = ""
        provided_hmac = ""
        for part in signature_header.split(";"):
            part = part.strip()
            if part.startswith("ts="):
                ts = part[3:]
            elif part.startswith("h1="):
                provided_hmac = part[3:]

        if not ts or not provided_hmac:
            return False

        # Compute expected hmac over "ts:<body>"
        body_text = raw_payload.decode("utf-8") if isinstance(raw_payload, bytes) else str(raw_payload)
        signing_string = f"{ts}:{body_text}"

        expected = hmac.new(
            webhook_secret.encode("utf-8"),
            signing_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected, provided_hmac)


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def get_paddle_client() -> PaddleClient:
    """Create a Paddle client from environment variables."""
    api_key = os.getenv("PADDLE_API_KEY", "").strip()
    environment = os.getenv("PADDLE_ENV", "sandbox").strip().lower()
    if not api_key:
        raise ValueError("PADDLE_API_KEY is not configured")
    return PaddleClient(api_key, environment)
