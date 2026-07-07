import os
import sys
import json
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.creem_client import CreemClient, get_creem_client

def test_creem_api():
    print("=" * 60)
    print("Creem API Diagnostic Test")
    print("=" * 60)
    
    api_key = os.getenv("CREEM_API_KEY", "")
    test_mode = os.getenv("CREEM_TEST_MODE", "false").lower() == "true"
    product_id = os.getenv("CREEM_PRO_PRODUCT_ID", "")
    
    print(f"\nConfiguration:")
    print(f"  API Key set: {'YES' if api_key else 'NO'}")
    print(f"  API Key length: {len(api_key) if api_key else 0}")
    print(f"  Test Mode: {test_mode}")
    print(f"  Product ID: {'YES' if product_id else 'NO'}")
    print(f"  Base URL: {'https://test-api.creem.io' if test_mode else 'https://api.creem.io'}")
    
    if not api_key:
        print("\n❌ ERROR: CREEM_API_KEY is not set!")
        return
    
    try:
        creem = CreemClient(api_key, test_mode)
        print("\n✅ Creem client initialized successfully")
    except Exception as e:
        print(f"\n❌ Failed to initialize Creem client: {e}")
        return
    
    print("\n" + "=" * 60)
    print("Testing API Endpoints")
    print("=" * 60)
    
    endpoints_to_test = [
        ("GET /v1/products", lambda: creem.list_products()),
        ("GET /v1/products (single)", lambda: creem.get_product("test")),
        ("GET /v1/customers", lambda: creem.get_customer(email="test@example.com")),
        ("POST /v1/customers", lambda: creem.create_customer(email="test_api_check@example.com", name="Test User")),
        ("GET /v1/subscriptions", lambda: creem.get_subscription("test")),
        ("GET /v1/subscriptions/search", lambda: creem.search_subscriptions()),
    ]
    
    for name, func in endpoints_to_test:
        print(f"\nTesting: {name}")
        try:
            result = func()
            print(f"  ✅ Success")
            if isinstance(result, dict):
                print(f"  Response keys: {list(result.keys())[:10]}")
                if "data" in result:
                    if isinstance(result["data"], dict):
                        print(f"  Data keys: {list(result['data'].keys())[:10]}")
                    elif isinstance(result["data"], list):
                        print(f"  Data is list with {len(result['data'])} items")
            print(f"  Response type: {type(result).__name__}")
        except Exception as e:
            error_str = str(e)
            print(f"  ❌ Failed: {error_str[:200]}")
    
    print("\n" + "=" * 60)
    print("Testing Customer Portal Endpoints")
    print("=" * 60)
    
    portal_endpoints = [
        "/v1/customer-portal",
        "/v1/portal", 
        "/v1/billing-portal",
        "/v1/customer_portal",
        "/v1/portal/session",
        "/customer-portal",
        "/portal",
    ]
    
    for endpoint in portal_endpoints:
        print(f"\nTesting POST {endpoint}")
        try:
            response = creem.client.post(endpoint, json={"customer_id": "test"})
            print(f"  Status: {response.status_code}")
            try:
                data = response.json()
                print(f"  Response keys: {list(data.keys())[:10]}")
                if "error" in data:
                    print(f"  Error: {data.get('error')}")
            except:
                print(f"  Response text: {response.text[:200]}")
        except Exception as e:
            print(f"  ❌ Failed: {str(e)[:100]}")
    
    print("\n" + "=" * 60)
    print("Testing Subscription Management")
    print("=" * 60)
    
    try:
        subs = creem.search_subscriptions()
        print(f"\n✅ search_subscriptions succeeded")
        items = subs.get("items") or subs.get("data") or subs.get("subscriptions") or []
        print(f"Found {len(items)} subscriptions")
        
        if items:
            first_sub = items[0]
            sub_id = first_sub.get("id") or first_sub.get("subscription_id")
            print(f"\nFirst subscription ID: {sub_id}")
            print(f"Status: {first_sub.get('status')}")
            print(f"Customer ID: {first_sub.get('customer_id')}")
            
            if sub_id:
                try:
                    sub_data = creem.get_subscription(sub_id)
                    print(f"\n✅ get_subscription({sub_id}) succeeded")
                    if isinstance(sub_data, dict):
                        print(f"  Keys: {list(sub_data.keys())[:15]}")
                        if "data" in sub_data and isinstance(sub_data["data"], dict):
                            sub_data = sub_data["data"]
                            print(f"  Data keys: {list(sub_data.keys())[:15]}")
                            print(f"  Status: {sub_data.get('status')}")
                            print(f"  Customer ID: {sub_data.get('customer_id')}")
                            print(f"  Current period end: {sub_data.get('current_period_end') or sub_data.get('current_period_end_date')}")
                            print(f"  Customer: {sub_data.get('customer', {}).keys() if isinstance(sub_data.get('customer'), dict) else sub_data.get('customer')}")
                except Exception as e:
                    print(f"❌ get_subscription({sub_id}) failed: {e}")
    except Exception as e:
        print(f"❌ search_subscriptions failed: {e}")
    
    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    test_creem_api()