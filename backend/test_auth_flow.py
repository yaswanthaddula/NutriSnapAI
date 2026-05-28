import requests

BASE_URL = "http://localhost:8000"

def test_registration():
    print("Testing Registration...")
    payload = {
        "name": "Test User",
        "email": "testuser@gmail.com",
        "password": "123456"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

def test_login():
    print("\nTesting Login...")
    payload = {
        "email": "testuser@gmail.com",
        "password": "123456"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_registration()
    test_login()
