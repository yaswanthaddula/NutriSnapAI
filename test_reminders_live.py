import httpx

def run():
    # Login to get token
    login_resp = httpx.post('http://127.0.0.1:8000/auth/login', json={
        "email": "test@example.com",
        "password": "password123"
    })
    
    if login_resp.status_code != 200:
        print("Login failed, please check test account:", login_resp.text)
        return
        
    token = login_resp.json().get('access_token')
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create a reminder
    payload = {
        "reminder_type": "breakfast",
        "title": "Breakfast Time",
        "reminder_time": "08:30 AM",
        "is_enabled": True
    }
    create_resp = httpx.post('http://127.0.0.1:8000/reminders', json=payload, headers=headers)
    print("CREATE:", create_resp.status_code, create_resp.text)
    
    # 2. Get reminders
    get_resp = httpx.get('http://127.0.0.1:8000/reminders', headers=headers)
    print("GET ALL:", get_resp.status_code, get_resp.text)

if __name__ == "__main__":
    run()
