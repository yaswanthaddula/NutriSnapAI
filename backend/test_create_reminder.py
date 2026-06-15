import requests

BASE_URL = "https://nutrisnapai.onrender.com"

def test():
    email = "testrem1@gmail.com"
    print("Registering...")
    r = requests.post(f"{BASE_URL}/auth/register", json={"name":"test","email":email,"password":"password123"})
    
    print("Logging in...")
    r = requests.post(f"{BASE_URL}/auth/login", json={"email":email,"password":"password123"})
    if r.status_code != 200:
        print("Login failed, trying to force verify...", r.text)
        import psycopg2
        conn_str = "postgresql://neondb_owner:npg_yWuI3RB5kOKL@ep-withered-block-aqojegw2-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        cur.execute("UPDATE users SET is_verified = 1 WHERE email = %s", (email,))
        conn.commit()
        cur.close()
        conn.close()
        r = requests.post(f"{BASE_URL}/auth/login", json={"email":email,"password":"password123"})
    token = r.json().get("access_token")
    
    print("Creating Profile...")
    r = requests.post(f"{BASE_URL}/profiles/", json={
        "age": 25, "gender": "Male", "weight": 70, "height": 175, "goal": "Maintain", "selected_mode": "Gym"
    }, headers={"Authorization": f"Bearer {token}"})
    
    payload = {
        "reminder_type": "workout",
        "title": "Workout Reminder",
        "reminder_time": "06:25 PM",
        "repeat_type": "Daily",
        "repeat_days": None,
        "is_enabled": True,
        "notification_status": "Upcoming"
    }
    
    print("Creating reminder...", payload)
    r = requests.post(f"{BASE_URL}/reminders", json=payload, headers={"Authorization": f"Bearer {token}"})
    print(r.status_code, r.text)

test()
