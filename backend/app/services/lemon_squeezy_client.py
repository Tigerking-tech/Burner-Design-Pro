"""
Lemon Squeezy API Client
https://docs.lemonsqueezy.com/api

Usage:
    - Set LEMON_SQUEEZY_API_KEY in your environment
    - Create a Product and get its VARIANT ID (not Product ID)
    - Configure LEMON_SQUEEZY_PRO_VARIANT_ID with your Pro plan variant ID
    - Set up a webhook endpoint in Lemon Squeezy dashboard
    - Set LEMON_SQUEEZY_WEBHOOK_SECRET for webhook signature verification

Key differences from Creem:
    - Lemon Squeezy uses "Checkout" sessions similar to Creem
    - Product pricing is attached to "Variants" (not Products directly)
    - Webhook payload format is different
"""
import os
import httpx
import hmac
import hashlib
import json
from typing import Optional, Dict, Any


class LemonSqueezyClient:
    """Lemon Squeezy API Client"""

    BASE_URL = "https://api.lemonsqueezy.com/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
        }
        self.client = httpx.Client(
            base_url=self.BASE_URL,
            headers=self.headers,
            timeout=30.0,
        )

    # ------------------------------------------------------------------
    # Checkouts
    # ------------------------------------------------------------------
    def create_checkout(
        self,
        variant_id: str,
        customer_email: Optional[str] = None,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        redirect_url: Optional[str] = None,
        custom_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a hosted checkout session for a subscription.

        :param variant_id: The Lemon Squeezy VARIANT ID (NOT product id)
        :param customer_email: Optional pre-filled email
        :param success_url: URL to redirect after successful payment
        :param cancel_url: URL to redirect after cancelled payment
        :param redirect_url: Alternative redirect URL
        :param custom_data: Metadata you want attached to the subscription
        :returns: Full Lemon Squeezy checkout object, including `url`
        """
        payload: Dict[str, Any] = {
            "data": {
                "type": "checkouts",
                "attributes": {
                    "checkout_data": {},
                    "product_options": {
                        "enabled_variants": [int(variant_id)],
                    },
                    "checkout_options": {
                        "embed": False,
                        "media": False,
                        "logo": True,
                        "desc": True,
                        "dark": False,
                        "subscription_preview": True,
                    },
                },
                "relationships": {
                    "store": {
                        "data": {
                            "type": "stores",
                            "id": os.getenv("LEMON_SQUEEZY_STORE_ID", ""),
                        }
                    },
                    "variant": {
                        "data": {
                            "type": "variants",
                            "id": str(variant_id),
                        }
                    },
                },
            }
        }

        # Pre-fill customer email
        if customer_email:
            payload["data"]["attributes"]["checkout_data"]["email"] = customer_email

        if custom_data:
            payload["data"]["attributes"]["checkout_data"]["custom"] = custom_data

        # Redirect URLs
        if success_url or redirect_url:
            payload["data"]["attributes"]["redirect_url"] = success_url or redirect_url

        response = self.client.post("/checkouts", json=payload)
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise Exception(f"Lemon Squeezy API Error: {e.response.status_code} - {e.response.text}")

        return response.json()

    # ------------------------------------------------------------------
    # Subscriptions
    # ------------------------------------------------------------------
    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Get a subscription by ID"""
        response = self.client.get(f"/subscriptions/{subscription_id}")
        response.raise_for_status()
        return response.json()

    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Cancel a subscription at the end of the billing period"""
        payload = {
            "data": {
                "type": "subscriptions",
                "id": subscription_id,
                "attributes": {"cancelled": True},
            }
        }
        response = self.client.patch(
            f"/subscriptions/{subscription_id}",
            json=payload,
        )
        response.raise_for_status()
        return response.json()

    # ------------------------------------------------------------------
    # Customer Portal (Billing URL)
    # ------------------------------------------------------------------
    def get_customer_portal_url(self, subscription_id: str) -> Optional[str]:
        """
        Get the customer portal URL for managing billing.
        In Lemon Squeezy, the portal URL is returned inside the subscription object
        under `data.attributes.urls.customer_portal`.
        """
        try:
            sub = self.get_subscription(subscription_id)
            return (
                sub.get("data", {})
                .get("attributes", {})
                .get("urls", {})
                .get("customer_portal")
            )
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Orders / receipts (for admin use)
    # ------------------------------------------------------------------
    def list_orders(self, page: int = 1, per_page: int = 100) -> Dict[str, Any]:
        """List orders from your store"""
        response = self.client.get(
            "/orders",
            params={"page[number]": page, "page[size]": per_page},
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
        Verify the X-Signature header of an incoming Lemon Squeezy webhook.

        Lemon Squeezy computes HMAC-SHA256 of the request body using
        the webhook signing secret as the key and returns the hex digest.
        """
        if not signature_header or not webhook_secret:
            return False

        expected = hmac.new(
            webhook_secret.encode("utf-8"),
            raw_payload,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected, signature_header.strip())


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def get_lemon_squeezy_client() -> LemonSqueezyClient:
    """Create a Lemon Squeezy client from environment variables."""
    api_key = os.getenv("LEMON_SQUEEZY_API_KEY", "").strip()
    if not api_key:
        raise ValueError("LEMON_SQUEEZY_API_KEY is not configured")
    return LemonSqueezyClient(api_key)
