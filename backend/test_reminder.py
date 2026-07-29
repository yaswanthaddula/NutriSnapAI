import json
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

import random
import string
email = ''.join(random.choices(string.ascii_lowercase, k=10)) + "@test.com"

# Register
res = client.post("/auth/register", json={
    "name": "Test",
    "email": email,
    "password": "password123",
    "confirm_password": "password123"
})

# Login using OAuth2 form data
res = client.post("/auth/login", data={"username": email, "password": "password123"})
if res.status_code != 200:
    print("LOGIN FAILED:", res.json())
else:
    token = res.json()["access_token"]
    payload = {
        "mode": "health",
        "reminder_type": "breakfast",
        "title": "Breakfast Reminder",
        "message": "Time to log your breakfast.",
        "reminder_time": "08:00 AM",
        "repeat_type": "Daily",
        "repeat_days": None,
        "is_enabled": True,
        "status": "Upcoming"
    }
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/reminders", json=payload, headers=headers)
    print("CREATE REMINDER RESPONSE:", res.status_code)
    print(res.json())
