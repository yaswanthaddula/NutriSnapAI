from database import SessionLocal
import models

def main():
    db = SessionLocal()
    try:
        reminders = db.query(models.Reminder).all()
        print("--- ALL REMINDERS ---")
        for r in reminders:
            print(f"ID: {r.id}, UserID: {r.user_id}, Type: {r.reminder_type}, Time: {r.reminder_time}, Repeat: {r.repeat_type}, Enabled: {r.is_enabled}, Status: {r.status}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
