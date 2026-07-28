import requests
import random
import string

BASE_URL = "https://nutrisnapai.onrender.com"
fake_email = ''.join(random.choices(string.ascii_lowercase, k=10)) + "@example.com"
password = "password123"

# 1. Register
requests.post(f"{BASE_URL}/auth/register", json={
    "name": "Test User",
    "email": fake_email,
    "password": password
})

# 2. Login
login_res = requests.post(f"{BASE_URL}/auth/login", json={
    "email": fake_email,
    "password": password
})

if login_res.status_code != 200:
    print("Login Failed:", login_res.text)
else:
    token = login_res.json().get("access_token")
    print("Logged in, token:", token[:10] + "...")
    
    # 3. Upload dummy image
    test_file = "test_img.jpg"
    with open(test_file, "wb") as f:
        f.write(b"fake image data")
        
    with open(test_file, "rb") as f:
        files = {'file': ('test_img.jpg', f, 'image/jpeg')}
        headers = {'Authorization': f'Bearer {token}'}
        upload_res = requests.post(f"{BASE_URL}/upload/profile-photo", files=files, headers=headers)
        
    print("Upload Res Status:", upload_res.status_code)
    print("Upload Res Body:", upload_res.text)
