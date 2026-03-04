import requests
import sys
import json
from datetime import datetime, timedelta

class BeautyBookingAPITester:
    def __init__(self, base_url="https://hairpros-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.client_token = None
        self.stylist_token = None
        self.client_user = None
        self.stylist_user = None
        self.stylist_id = None
        self.booking_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        try:
            response = requests.get(f"{self.base_url}/")
            success = response.status_code == 200
            self.log_test("Root endpoint", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Root endpoint", False, f"Exception: {str(e)}")

        # Test health endpoint
        try:
            response = requests.get(f"{self.base_url}/health")
            success = response.status_code == 200
            self.log_test("Health endpoint", success, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Health endpoint", False, f"Exception: {str(e)}")

    def test_client_registration(self):
        """Test client registration with Turnstile"""
        print("\n🔍 Testing Client Registration...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        client_data = {
            "email": f"testclient{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test Client {timestamp}",
            "role": "client",
            "turnstile_token": "1x00000000000000000000AA"  # Cloudflare test token
        }
        
        success, response = self.run_test(
            "Client Registration",
            "POST",
            "auth/register",
            201,
            data=client_data
        )
        
        if success and 'access_token' in response:
            self.client_token = response['access_token']
            self.client_user = response['user']
            return True
        return False

    def test_stylist_registration(self):
        """Test stylist registration with profile and pricing"""
        print("\n🔍 Testing Stylist Registration...")
        
        timestamp = datetime.now().strftime('%H%M%S')
        stylist_data = {
            "email": f"teststylist{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test Stylist {timestamp}",
            "phone": "+1234567890",
            "profile": {
                "skills": ["haircut", "coloring"],
                "bio": "Professional stylist with 5 years experience",
                "service_area": {
                    "latitude": 40.7128,
                    "longitude": -74.0060,
                    "address": "123 Test St, New York, NY"
                },
                "service_radius_miles": 15.0,
                "portfolio_images": []
            },
            "pricing": [
                {
                    "service": "haircut",
                    "price_min": 50.0,
                    "price_max": 100.0,
                    "duration_minutes": 60
                },
                {
                    "service": "coloring",
                    "price_min": 80.0,
                    "price_max": 150.0,
                    "duration_minutes": 120
                }
            ],
            "turnstile_token": "1x00000000000000000000AA"
        }
        
        success, response = self.run_test(
            "Stylist Registration",
            "POST",
            "stylists/register",
            201,
            data=stylist_data
        )
        
        if success and 'access_token' in response:
            self.stylist_token = response['access_token']
            self.stylist_user = response['user']
            self.stylist_id = response.get('stylist_id')
            return True
        return False

    def test_login_flow(self):
        """Test login for both client and stylist"""
        print("\n🔍 Testing Login Flow...")
        
        if not self.client_user:
            self.log_test("Client Login", False, "No client user to test login")
            return False
            
        # Test client login
        login_data = {
            "email": self.client_user['email'],
            "password": "TestPass123!",
            "turnstile_token": "1x00000000000000000000AA"
        }
        
        success, response = self.run_test(
            "Client Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return success

    def test_stylists_endpoints(self):
        """Test stylist search and top stylists"""
        print("\n🔍 Testing Stylist Endpoints...")
        
        # Test search stylists
        success, response = self.run_test(
            "Search Stylists",
            "GET",
            "stylists/search",
            200
        )
        
        # Test top stylists
        success, response = self.run_test(
            "Top Stylists",
            "GET",
            "stylists/top?limit=5",
            200
        )
        
        # Test get specific stylist
        if self.stylist_id:
            success, response = self.run_test(
                "Get Stylist Details",
                "GET",
                f"stylists/{self.stylist_id}",
                200
            )

    def test_authenticated_endpoints(self):
        """Test endpoints that require authentication"""
        print("\n🔍 Testing Authenticated Endpoints...")
        
        if not self.client_token:
            self.log_test("Auth endpoints", False, "No client token available")
            return
            
        headers = {'Authorization': f'Bearer {self.client_token}'}
        
        # Test get current user
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            headers=headers
        )

    def test_booking_flow(self):
        """Test booking estimation and creation"""
        print("\n🔍 Testing Booking Flow...")
        
        if not self.client_token or not self.stylist_id:
            self.log_test("Booking Flow", False, "Missing client token or stylist ID")
            return
            
        headers = {'Authorization': f'Bearer {self.client_token}'}
        
        # Test price estimation
        estimate_data = {
            "stylist_id": self.stylist_id,
            "services": ["haircut"],
            "client_location": {
                "latitude": 40.7580,
                "longitude": -73.9855,
                "address": "456 Client St, New York, NY"
            }
        }
        
        success, response = self.run_test(
            "Price Estimation",
            "POST",
            "bookings/estimate",
            200,
            data=estimate_data,
            headers=headers
        )
        
        if success:
            # Test booking creation
            booking_data = {
                "stylist_id": self.stylist_id,
                "services": ["haircut"],
                "preferred_datetime": (datetime.now() + timedelta(days=1)).isoformat(),
                "client_location": {
                    "latitude": 40.7580,
                    "longitude": -73.9855,
                    "address": "456 Client St, New York, NY"
                },
                "notes": "Test booking"
            }
            
            success, response = self.run_test(
                "Create Booking",
                "POST",
                "bookings/create",
                201,
                data=booking_data,
                headers=headers
            )
            
            if success and 'booking_id' in response:
                self.booking_id = response['booking_id']

    def test_payment_flow(self):
        """Test payment checkout creation"""
        print("\n🔍 Testing Payment Flow...")
        
        if not self.client_token or not self.booking_id:
            self.log_test("Payment Flow", False, "Missing client token or booking ID")
            return
            
        headers = {'Authorization': f'Bearer {self.client_token}'}
        
        success, response = self.run_test(
            "Create Checkout Session",
            "POST",
            f"payments/create-checkout?booking_id={self.booking_id}",
            200,
            headers=headers
        )

    def test_dashboard_endpoints(self):
        """Test dashboard data endpoints"""
        print("\n🔍 Testing Dashboard Endpoints...")
        
        if self.client_token:
            headers = {'Authorization': f'Bearer {self.client_token}'}
            success, response = self.run_test(
                "Client Bookings",
                "GET",
                "bookings/my-bookings",
                200,
                headers=headers
            )
        
        if self.stylist_token:
            headers = {'Authorization': f'Bearer {self.stylist_token}'}
            success, response = self.run_test(
                "Stylist Profile",
                "GET",
                "stylists/profile/me",
                200,
                headers=headers
            )

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Beauty Booking API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Basic health checks
        self.test_health_check()
        
        # Registration tests
        client_reg_success = self.test_client_registration()
        stylist_reg_success = self.test_stylist_registration()
        
        # Login tests
        if client_reg_success:
            self.test_login_flow()
        
        # Public endpoints
        self.test_stylists_endpoints()
        
        # Authenticated endpoints
        self.test_authenticated_endpoints()
        
        # Booking flow
        if client_reg_success and stylist_reg_success:
            self.test_booking_flow()
            self.test_payment_flow()
        
        # Dashboard endpoints
        self.test_dashboard_endpoints()
        
        # Print summary
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BeautyBookingAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
            },
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())