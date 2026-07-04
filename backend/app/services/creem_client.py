"""
Creem API Client
https://docs.creem.io
"""
import os
import httpx
import hmac
import hashlib
import json
from typing import Optional, Dict, Any
from datetime import datetime


class CreemClient:
    """Creem API Client"""
    
    PRODUCTION_URL = "https://api.creem.io"
    TEST_URL = "https://test-api.creem.io"
    
    def __init__(self, api_key: str, test_mode: bool = False):
        self.api_key = api_key
        self.base_url = self.TEST_URL if test_mode else self.PRODUCTION_URL
        self.client = httpx.Client(
            base_url=self.base_url,
            headers={
                "x-api-key": api_key,
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
    
    def _make_request(self, method: str, path: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make API request"""
        try:
            if method.upper() == "GET":
                response = self.client.get(path, params=data)
            elif method.upper() == "POST":
                response = self.client.post(path, json=data)
            elif method.upper() == "PATCH":
                response = self.client.patch(path, json=data)
            elif method.upper() == "DELETE":
                response = self.client.delete(path)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            error_detail = e.response.json() if e.response.content else {}
            raise Exception(f"Creem API Error: {e.response.status_code} - {error_detail}")
        except Exception as e:
            raise Exception(f"Creem API Error: {str(e)}")
    
    # ============== Products ==============
    
    def create_product(self, name: str, price: int, currency: str = "USD", 
                      interval: str = "month", description: str = "",
                      product_type: str = "subscription") -> Dict[str, Any]:
        """
        Create a product
        - price: in cents (1000 = $10.00)
        - interval: 'month', 'year', or empty for one-time
        """
        return self._make_request("POST", "/v1/products", {
            "name": name,
            "price": price,
            "currency": currency,
            "interval": interval,
            "description": description,
            "product_type": product_type
        })
    
    def get_product(self, product_id: str) -> Dict[str, Any]:
        """Get product by ID"""
        return self._make_request("GET", "/v1/products", {"product_id": product_id})
    
    def list_products(self) -> Dict[str, Any]:
        """List all products"""
        return self._make_request("GET", "/v1/products/search", {})
    
    # ============== Customers ==============
    
    def get_customer(self, customer_id: str = None, email: str = None) -> Dict[str, Any]:
        """Get customer by ID or email"""
        params = {}
        if customer_id:
            params["customer_id"] = customer_id
        if email:
            params["email"] = email
        return self._make_request("GET", "/v1/customers", params)
    
    def create_customer(self, email: str, name: str = "", 
                       metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Create or get customer"""
        data = {
            "email": email,
            "name": name
        }
        if metadata:
            data["metadata"] = metadata
        return self._make_request("POST", "/v1/customers", data)
    
    def create_customer_portal(self, customer_id: str, 
                              return_url: str = "") -> Dict[str, Any]:
        """Create customer portal link for managing subscription"""
        data = {"customer_id": customer_id}
        if return_url:
            data["return_url"] = return_url
        return self._make_request("POST", "/v1/customer-portal", data)
    
    # ============== Checkouts ==============
    
    def create_checkout(self, product_id: str, customer_id: str = None,
                       price_id: str = None,
                       success_url: str = "",
                       cancel_url: str = "",
                       metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Create checkout session
        Returns checkout URL for redirect
        """
        data = {
            "product_id": product_id,
        }
        
        if customer_id:
            data["customer_id"] = customer_id
        if price_id:
            data["price_id"] = price_id
        if success_url:
            data["success_url"] = success_url
        if cancel_url:
            data["cancel_url"] = cancel_url
        if metadata:
            data["metadata"] = metadata
        
        return self._make_request("POST", "/v1/checkouts", data)
    
    def get_checkout(self, checkout_id: str) -> Dict[str, Any]:
        """Get checkout status"""
        return self._make_request("GET", "/v1/checkouts", {"checkout_id": checkout_id})
    
    # ============== Subscriptions ==============
    
    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Get subscription details"""
        return self._make_request("GET", "/v1/subscriptions", 
                                 {"subscription_id": subscription_id})
    
    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Cancel subscription"""
        return self._make_request("POST", f"/v1/subscriptions/{subscription_id}/cancel", {})
    
    def pause_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Pause subscription"""
        return self._make_request("POST", f"/v1/subscriptions/{subscription_id}/pause", {})
    
    def resume_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Resume subscription"""
        return self._make_request("POST", f"/v1/subscriptions/{subscription_id}/resume", {})
    
    def upgrade_subscription(self, subscription_id: str, product_id: str,
                           update_behavior: str = "proration-charge-immediately") -> Dict[str, Any]:
        """Upgrade/downgrade subscription"""
        return self._make_request("POST", f"/v1/subscriptions/{subscription_id}/upgrade", {
            "product_id": product_id,
            "update_behavior": update_behavior
        })
    
    # ============== Transactions ==============
    
    def list_transactions(self, limit: int = 50, 
                         starting_after: str = None) -> Dict[str, Any]:
        """List transactions"""
        data = {"limit": limit}
        if starting_after:
            data["starting_after"] = starting_after
        return self._make_request("GET", "/v1/transactions/search", data)
    
    # ============== Webhook Verification ==============
    
    @staticmethod
    def verify_webhook(payload: str, signature: str, 
                      webhook_secret: str) -> bool:
        """Verify webhook signature"""
        try:
            expected_signature = hmac.new(
                webhook_secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected_signature, signature)
        except Exception:
            return False


def get_creem_client() -> CreemClient:
    """Get Creem client from environment"""
    api_key = os.getenv("CREEM_API_KEY", "")
    test_mode = os.getenv("CREEM_TEST_MODE", "false").lower() == "true"
    
    if not api_key:
        raise ValueError("CREEM_API_KEY not configured. Please set it in your Render environment variables.")
    
    product_id = os.getenv("CREEM_PRO_PRODUCT_ID", "")
    print(f"[Creem] Initializing client - API Key set: {bool(api_key)}, Test Mode: {test_mode}, Product ID set: {bool(product_id)}")
    
    return CreemClient(api_key, test_mode)
