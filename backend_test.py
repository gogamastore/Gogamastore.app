#!/usr/bin/env python3
"""
Backend API Testing for Gogama Store
Tests all backend APIs including authentication, products, categories, cart, and profile
SPECIAL FOCUS: Firebase Order Data Fetching Debug and Order Management APIs
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    except:
        pass
    return "https://gogama-ecom.preview.emergentagent.com"

BASE_URL = get_backend_url() + "/api"
print(f"Testing backend at: {BASE_URL}")

# Test data
TEST_USER = {
    "nama_lengkap": "Sari Wijaya",
    "email": f"sari.wijaya.{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
    "nomor_whatsapp": "081234567890",
    "password": "password123"
}

# Global variables for test state
auth_token = None
test_product_id = None
test_results = []

def log_test(test_name, success, message="", response_data=None):
    """Log test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if message:
        print(f"   {message}")
    if response_data and not success:
        print(f"   Response: {response_data}")
    
    test_results.append({
        "test": test_name,
        "success": success,
        "message": message,
        "response": response_data
    })

def test_user_registration():
    """Test user registration endpoint"""
    print("\n=== Testing User Registration ===")
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=TEST_USER, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                global auth_token
                auth_token = data["access_token"]
                log_test("User Registration", True, f"User registered successfully: {data['user']['nama_lengkap']}")
                return True
            else:
                log_test("User Registration", False, "Missing access_token or user in response", data)
                return False
        else:
            log_test("User Registration", False, f"HTTP {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("User Registration", False, f"Request failed: {str(e)}")
        return False

def test_user_login():
    """Test user login endpoint"""
    print("\n=== Testing User Login ===")
    
    login_data = {
        "email": TEST_USER["email"],
        "password": TEST_USER["password"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                global auth_token
                auth_token = data["access_token"]
                log_test("User Login", True, f"Login successful for: {data['user']['email']}")
                return True
            else:
                log_test("User Login", False, "Missing access_token or user in response", data)
                return False
        else:
            log_test("User Login", False, f"HTTP {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("User Login", False, f"Request failed: {str(e)}")
        return False

def test_get_products():
    """Test get all products endpoint"""
    print("\n=== Testing Get Products ===")
    
    if not auth_token:
        log_test("Get Products", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/products", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                global test_product_id
                if len(data) > 0:
                    test_product_id = data[0]["id"]
                    log_test("Get Products", True, f"Retrieved {len(data)} products")
                    return True
                else:
                    log_test("Get Products", True, "No products found (empty list)")
                    return True
            else:
                log_test("Get Products", False, "Response is not a list", data)
                return False
        else:
            log_test("Get Products", False, f"HTTP {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("Get Products", False, f"Request failed: {str(e)}")
        return False

def test_get_single_product():
    """Test get single product endpoint"""
    print("\n=== Testing Get Single Product ===")
    
    if not auth_token:
        log_test("Get Single Product", False, "No auth token available")
        return False
        
    if not test_product_id:
        log_test("Get Single Product", False, "No product ID available for testing")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/products/{test_product_id}", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "nama" in data:
                log_test("Get Single Product", True, f"Retrieved product: {data['nama']}")
                return True
            else:
                log_test("Get Single Product", False, "Missing required fields in product", data)
                return False
        else:
            log_test("Get Single Product", False, f"HTTP {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("Get Single Product", False, f"Request failed: {str(e)}")
        return False

def test_get_categories():
    """Test get categories endpoint"""
    print("\n=== Testing Get Categories ===")
    
    if not auth_token:
        log_test("Get Categories", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/categories", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get Categories", True, f"Retrieved {len(data)} categories")
                return True
            else:
                log_test("Get Categories", False, "Response is not a list", data)
                return False
        else:
            log_test("Get Categories", False, f"HTTP {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("Get Categories", False, f"Request failed: {str(e)}")
        return False

def test_get_products_by_category():
    """Test get products by category endpoint"""
    print("\n=== Testing Get Products by Category ===")
    
    if not auth_token:
        log_test("Get Products by Category", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    category_name = "Elektronik"  # Test with sample category
    
    try:
        response = requests.get(f"{BASE_URL}/products/by-category/{category_name}", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("Get Products by Category", True, f"Retrieved {len(data)} products for category '{category_name}'")
                return True
            else:
                log_test("Get Products by Category", False, "Response is not a list", data)
                return False
        else:
            log_test("Get Products by Category", False, f"HTTP {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("Get Products by Category", False, f"Request failed: {str(e)}")
        return False

def test_get_cart():
    """Test get cart endpoint"""
    print("\n=== Testing Get Cart ===")
    
    if not auth_token:
        log_test("Get Cart", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/cart", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "user_id" in data and "items" in data:
                log_test("Get Cart", True, f"Retrieved cart with {len(data['items'])} items")
                return True
            else:
                log_test("Get Cart", False, "Missing required fields in cart", data)
                return False
        else:
            log_test("Get Cart", False, f"HTTP {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("Get Cart", False, f"Request failed: {str(e)}")
        return False

def test_add_to_cart():
    """Test add to cart endpoint"""
    print("\n=== Testing Add to Cart ===")
    
    if not auth_token:
        log_test("Add to Cart", False, "No auth token available")
        return False
        
    if not test_product_id:
        log_test("Add to Cart", False, "No product ID available for testing")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    params = {"product_id": test_product_id, "quantity": 2}
    
    try:
        response = requests.post(f"{BASE_URL}/cart/add", headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "cart" in data:
                log_test("Add to Cart", True, f"Added product to cart: {data['message']}")
                return True
            else:
                log_test("Add to Cart", False, "Missing message or cart in response", data)
                return False
        else:
            log_test("Add to Cart", False, f"HTTP {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("Add to Cart", False, f"Request failed: {str(e)}")
        return False

def test_remove_from_cart():
    """Test remove from cart endpoint"""
    print("\n=== Testing Remove from Cart ===")
    
    if not auth_token:
        log_test("Remove from Cart", False, "No auth token available")
        return False
        
    if not test_product_id:
        log_test("Remove from Cart", False, "No product ID available for testing")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.delete(f"{BASE_URL}/cart/remove/{test_product_id}", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "cart" in data:
                log_test("Remove from Cart", True, f"Removed product from cart: {data['message']}")
                return True
            else:
                log_test("Remove from Cart", False, "Missing message or cart in response", data)
                return False
        else:
            log_test("Remove from Cart", False, f"HTTP {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("Remove from Cart", False, f"Request failed: {str(e)}")
        return False

def test_get_profile():
    """Test get profile endpoint"""
    print("\n=== Testing Get Profile ===")
    
    if not auth_token:
        log_test("Get Profile", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/profile", headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "id" in data and "email" in data and "nama_lengkap" in data:
                log_test("Get Profile", True, f"Retrieved profile for: {data['nama_lengkap']}")
                return True
            else:
                log_test("Get Profile", False, "Missing required fields in profile", data)
                return False
        else:
            log_test("Get Profile", False, f"HTTP {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("Get Profile", False, f"Request failed: {str(e)}")
        return False

def test_update_profile():
    """Test update profile endpoint"""
    print("\n=== Testing Update Profile ===")
    
    if not auth_token:
        log_test("Update Profile", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    update_data = {
        "nama_lengkap": "Sari Wijaya Updated",
        "nomor_whatsapp": "081234567891"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/profile", headers=headers, json=update_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                log_test("Update Profile", True, f"Profile updated: {data['message']}")
                return True
            else:
                log_test("Update Profile", False, "Missing message in response", data)
                return False
        else:
            log_test("Update Profile", False, f"HTTP {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("Update Profile", False, f"Request failed: {str(e)}")
        return False

def test_firebase_order_endpoints():
    """Test Firebase-related order management endpoints"""
    print("\n=== Testing Firebase Order Management Endpoints ===")
    
    if not auth_token:
        log_test("Firebase Order Endpoints", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Test order creation endpoint
    try:
        response = requests.post(f"{BASE_URL}/orders", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Order Creation Endpoint", False, "❌ MISSING: POST /api/orders endpoint not implemented")
        else:
            log_test("Order Creation Endpoint", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Order Creation Endpoint", False, f"Request failed: {str(e)}")
    
    # Test get orders endpoint
    try:
        response = requests.get(f"{BASE_URL}/orders", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Get Orders Endpoint", False, "❌ MISSING: GET /api/orders endpoint not implemented")
        else:
            log_test("Get Orders Endpoint", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Get Orders Endpoint", False, f"Request failed: {str(e)}")
    
    # Test get order by ID endpoint
    try:
        response = requests.get(f"{BASE_URL}/orders/test-id", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Get Order by ID Endpoint", False, "❌ MISSING: GET /api/orders/{id} endpoint not implemented")
        else:
            log_test("Get Order by ID Endpoint", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Get Order by ID Endpoint", False, f"Request failed: {str(e)}")
    
    # Test update order status endpoint
    try:
        response = requests.put(f"{BASE_URL}/orders/test-id/status", headers=headers, json={"status": "confirmed"}, timeout=10)
        if response.status_code == 404:
            log_test("Update Order Status Endpoint", False, "❌ MISSING: PUT /api/orders/{id}/status endpoint not implemented")
        else:
            log_test("Update Order Status Endpoint", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Update Order Status Endpoint", False, f"Request failed: {str(e)}")
    
    return False  # All endpoints are missing

def test_order_cancellation_endpoint():
    """Test order cancellation functionality"""
    print("\n=== Testing Order Cancellation Endpoint ===")
    
    if not auth_token:
        log_test("Order Cancellation", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    try:
        response = requests.put(f"{BASE_URL}/orders/test-id/cancel", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Order Cancellation Endpoint", False, "❌ MISSING: PUT /api/orders/{id}/cancel endpoint not implemented")
            return False
        else:
            log_test("Order Cancellation Endpoint", True, f"Endpoint exists (HTTP {response.status_code})")
            return True
    except Exception as e:
        log_test("Order Cancellation Endpoint", False, f"Request failed: {str(e)}")
        return False

def test_firebase_integration_endpoints():
    """Test Firebase integration endpoints"""
    print("\n=== Testing Firebase Integration Endpoints ===")
    
    if not auth_token:
        log_test("Firebase Integration", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Test Firebase sync endpoint
    try:
        response = requests.post(f"{BASE_URL}/firebase/sync", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Firebase Sync Endpoint", False, "❌ MISSING: POST /api/firebase/sync endpoint not implemented")
        else:
            log_test("Firebase Sync Endpoint", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Firebase Sync Endpoint", False, f"Request failed: {str(e)}")
    
    # Test Firebase auth validation endpoint
    try:
        response = requests.post(f"{BASE_URL}/firebase/validate", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Firebase Auth Validation", False, "❌ MISSING: POST /api/firebase/validate endpoint not implemented")
        else:
            log_test("Firebase Auth Validation", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Firebase Auth Validation", False, f"Request failed: {str(e)}")
    
    return False

def test_payment_proof_upload_endpoints():
    """Test payment proof upload endpoints"""
    print("\n=== Testing Payment Proof Upload Endpoints ===")
    
    if not auth_token:
        log_test("Payment Proof Upload", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Test payment proof upload endpoint
    try:
        response = requests.post(f"{BASE_URL}/payment-proof/upload", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Payment Proof Upload Endpoint", False, "❌ MISSING: POST /api/payment-proof/upload endpoint not implemented")
        else:
            log_test("Payment Proof Upload Endpoint", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Payment Proof Upload Endpoint", False, f"Request failed: {str(e)}")
    
    # Test get payment proof endpoint
    try:
        response = requests.get(f"{BASE_URL}/payment-proof/order/test-id", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Get Payment Proof Endpoint", False, "❌ MISSING: GET /api/payment-proof/order/{orderId} endpoint not implemented")
        else:
            log_test("Get Payment Proof Endpoint", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Get Payment Proof Endpoint", False, f"Request failed: {str(e)}")
    
    return False

def test_trending_products_endpoints():
    """Test trending products endpoints"""
    print("\n=== Testing Trending Products Endpoints ===")
    
    if not auth_token:
        log_test("Trending Products", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Test trending products endpoint
    try:
        response = requests.get(f"{BASE_URL}/products/trending", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Trending Products Endpoint", False, "❌ MISSING: GET /api/products/trending endpoint not implemented")
        else:
            log_test("Trending Products Endpoint", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Trending Products Endpoint", False, f"Request failed: {str(e)}")
    
    # Test trending products collection endpoint
    try:
        response = requests.get(f"{BASE_URL}/trending-products", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Trending Products Collection Endpoint", False, "❌ MISSING: GET /api/trending-products endpoint not implemented")
        else:
            log_test("Trending Products Collection Endpoint", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Trending Products Collection Endpoint", False, f"Request failed: {str(e)}")
    
    return False

def test_firebase_storage_integration():
    """Test Firebase Storage integration endpoints"""
    print("\n=== Testing Firebase Storage Integration ===")
    
    if not auth_token:
        log_test("Firebase Storage", False, "No auth token available")
        return False
    
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Test Firebase Storage config endpoint
    try:
        response = requests.get(f"{BASE_URL}/firebase/storage/config", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Firebase Storage Config", False, "❌ MISSING: GET /api/firebase/storage/config endpoint not implemented")
        else:
            log_test("Firebase Storage Config", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Firebase Storage Config", False, f"Request failed: {str(e)}")
    
    # Test Firebase Storage upload endpoint
    try:
        response = requests.post(f"{BASE_URL}/firebase/storage/upload", headers=headers, timeout=10)
        if response.status_code == 404:
            log_test("Firebase Storage Upload", False, "❌ MISSING: POST /api/firebase/storage/upload endpoint not implemented")
        else:
            log_test("Firebase Storage Upload", True, f"Endpoint exists (HTTP {response.status_code})")
    except Exception as e:
        log_test("Firebase Storage Upload", False, f"Request failed: {str(e)}")
    
    return False

def run_all_tests():
    """Run all backend API tests"""
    print("🚀 Starting Gogama Store Backend API Tests")
    print("🔥 SPECIAL FOCUS: Firebase Order Management & Order Cancellation")
    print("=" * 60)
    
    # Authentication tests
    if not test_user_registration():
        print("❌ Registration failed - stopping tests")
        return False
    
    if not test_user_login():
        print("❌ Login failed - stopping tests")
        return False
    
    # Products tests
    test_get_products()
    test_get_single_product()
    test_get_products_by_category()
    
    # Categories tests
    test_get_categories()
    
    # Cart tests
    test_get_cart()
    test_add_to_cart()
    test_remove_from_cart()
    
    # Profile tests
    test_get_profile()
    test_update_profile()
    
    # NEW: Firebase and Order Management tests
    print("\n" + "🔥" * 60)
    print("FIREBASE & ORDER MANAGEMENT TESTING")
    print("🔥" * 60)
    
    test_firebase_order_endpoints()
    test_order_cancellation_endpoint()
    test_firebase_integration_endpoints()
    
    # NEW: Payment Proof Upload System Testing
    print("\n" + "💳" * 60)
    print("PAYMENT PROOF UPLOAD SYSTEM TESTING")
    print("💳" * 60)
    
    test_payment_proof_upload_endpoints()
    test_firebase_storage_integration()
    
    # NEW: Trending Products Testing
    print("\n" + "📈" * 60)
    print("TRENDING PRODUCTS FUNCTIONALITY TESTING")
    print("📈" * 60)
    
    test_trending_products_endpoints()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 COMPREHENSIVE TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in test_results if result["success"])
    total = len(test_results)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    # Categorize results
    basic_api_tests = [r for r in test_results if not any(keyword in r["test"] for keyword in ["Firebase", "Order"])]
    firebase_order_tests = [r for r in test_results if any(keyword in r["test"] for keyword in ["Firebase", "Order"])]
    
    basic_passed = sum(1 for r in basic_api_tests if r["success"])
    firebase_passed = sum(1 for r in firebase_order_tests if r["success"])
    
    print(f"\n📈 BASIC API TESTS: {basic_passed}/{len(basic_api_tests)} passed")
    print(f"🔥 FIREBASE/ORDER TESTS: {firebase_passed}/{len(firebase_order_tests)} passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return True
    else:
        print(f"\n⚠️  {total - passed} tests failed")
        print("\n❌ Failed tests:")
        for result in test_results:
            if not result["success"]:
                print(f"  - {result['test']}: {result['message']}")
        
        # Special analysis for Firebase/Order issues
        if len(firebase_order_tests) > 0 and firebase_passed == 0:
            print(f"\n🔴 CRITICAL FINDING: Firebase/Order Management Backend Missing")
            print(f"   - All Firebase and order management endpoints are missing from backend")
            print(f"   - Frontend uses Firebase services but backend has no order APIs")
            print(f"   - This explains the Firebase order data fetching issues reported")
        
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)