from fastapi.testclient import TestClient
from main import app
from database import get_db, engine
from models import User
import auth

client = TestClient(app)

# Create a mock user bypassing login
def override_get_current_user():
    db = next(get_db())
    user = db.query(User).first()
    if not user:
        # Create a dummy user
        user = User(name="Test", email="test@test.com", password_hash="hash")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

app.dependency_overrides[auth.get_current_user] = override_get_current_user

payload = {
    "mode": "health",
    "reminder_type": "workout",
    "title": "Workout Reminder",
    "message": "Time for your workout session.",
    "reminder_time": "18:30:00",
    "repeat_type": "Daily",
    "repeat_days": None,
    "is_enabled": True,
    "status": "Upcoming"
}
r = client.post("/reminders", json=payload)
print("Status:", r.status_code)
print("Body:", r.json())
