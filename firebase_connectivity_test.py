#!/usr/bin/env python3
"""
Firebase Connectivity Test for Gogama Store
Tests Firebase configuration and basic connectivity
"""

import requests
import json
import sys

def test_firebase_project_connectivity():
    """Test Firebase project connectivity"""
    print("🔥 Testing Firebase Project Connectivity")
    print("=" * 50)
    
    # Firebase project details from frontend/lib/firebase.js
    project_id = "orderflow-r7jsk"
    api_key = "AIzaSyCv8M05daKu55b075KK7S5Xbctql-E822c"
    
    # Test Firebase REST API connectivity
    try:
        # Test Firestore REST API
        firestore_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents"
        
        response = requests.get(firestore_url, timeout=10)
        
        if response.status_code == 200:
            print("✅ Firebase Firestore REST API: ACCESSIBLE")
            data = response.json()
            if 'documents' in data:
                print(f"   📄 Found {len(data.get('documents', []))} collections")
            else:
                print("   📄 No documents found (empty database or permissions)")
            return True
        elif response.status_code == 403:
            print("❌ Firebase Firestore REST API: PERMISSION DENIED")
            print("   🔒 Database rules may be restricting access")
            return False
        else:
            print(f"❌ Firebase Firestore REST API: HTTP {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ Firebase connectivity test failed: {str(e)}")
        return False

def test_firebase_auth_connectivity():
    """Test Firebase Auth connectivity"""
    print("\n🔐 Testing Firebase Auth Connectivity")
    print("=" * 50)
    
    project_id = "orderflow-r7jsk"
    api_key = "AIzaSyCv8M05daKu55b075KK7S5Xbctql-E822c"
    
    try:
        # Test Firebase Auth REST API
        auth_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={api_key}"
        
        # Try to create a test account (this will fail if auth is disabled, but we can check connectivity)
        test_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "returnSecureToken": True
        }
        
        response = requests.post(auth_url, json=test_data, timeout=10)
        
        if response.status_code == 200:
            print("✅ Firebase Auth REST API: ACCESSIBLE")
            print("   🔑 Authentication service is working")
            return True
        elif response.status_code == 400:
            error_data = response.json()
            if "EMAIL_EXISTS" in error_data.get("error", {}).get("message", ""):
                print("✅ Firebase Auth REST API: ACCESSIBLE")
                print("   🔑 Authentication service is working (email already exists)")
                return True
            else:
                print("⚠️  Firebase Auth REST API: ACCESSIBLE but configuration issue")
                print(f"   Error: {error_data.get('error', {}).get('message', 'Unknown error')}")
                return True
        else:
            print(f"❌ Firebase Auth REST API: HTTP {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ Firebase Auth connectivity test failed: {str(e)}")
        return False

def test_firebase_collections():
    """Test specific Firebase collections used by the app"""
    print("\n📚 Testing Firebase Collections")
    print("=" * 50)
    
    project_id = "orderflow-r7jsk"
    collections_to_test = [
        "products",
        "categories", 
        "orders",
        "banners",
        "brands",
        "bank_accounts",
        "user"
    ]
    
    results = {}
    
    for collection in collections_to_test:
        try:
            url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/{collection}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                doc_count = len(data.get('documents', []))
                results[collection] = {"status": "✅ ACCESSIBLE", "count": doc_count}
                print(f"✅ {collection}: {doc_count} documents")
            elif response.status_code == 403:
                results[collection] = {"status": "❌ PERMISSION DENIED", "count": 0}
                print(f"❌ {collection}: Permission denied")
            else:
                results[collection] = {"status": f"❌ HTTP {response.status_code}", "count": 0}
                print(f"❌ {collection}: HTTP {response.status_code}")
                
        except Exception as e:
            results[collection] = {"status": f"❌ ERROR: {str(e)}", "count": 0}
            print(f"❌ {collection}: {str(e)}")
    
    return results

def main():
    """Run all Firebase connectivity tests"""
    print("🔥 Firebase Connectivity Test for Gogama Store")
    print("=" * 60)
    
    # Test basic connectivity
    firestore_ok = test_firebase_project_connectivity()
    auth_ok = test_firebase_auth_connectivity()
    
    # Test collections
    collection_results = test_firebase_collections()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 FIREBASE CONNECTIVITY SUMMARY")
    print("=" * 60)
    
    print(f"🔥 Firestore API: {'✅ Working' if firestore_ok else '❌ Failed'}")
    print(f"🔐 Auth API: {'✅ Working' if auth_ok else '❌ Failed'}")
    
    accessible_collections = sum(1 for r in collection_results.values() if "✅" in r["status"])
    total_collections = len(collection_results)
    
    print(f"📚 Collections: {accessible_collections}/{total_collections} accessible")
    
    if firestore_ok and auth_ok and accessible_collections > 0:
        print("\n🎉 Firebase connectivity is working!")
        print("   The issue is likely in the frontend Firebase SDK configuration or authentication flow.")
    elif firestore_ok and accessible_collections == 0:
        print("\n⚠️  Firebase is accessible but all collections are restricted.")
        print("   Check Firestore security rules.")
    else:
        print("\n❌ Firebase connectivity issues detected.")
        print("   Check Firebase project configuration and network connectivity.")
    
    return firestore_ok and auth_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)