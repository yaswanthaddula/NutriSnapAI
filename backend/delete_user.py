import os
import sys
basedir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(basedir)

from database import SessionLocal
import models

db = SessionLocal()
try:
    email = "kurubabalaji8@gmail.com"
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        print(f"Deleting user {email}...")
        # Delete profile first if it exists (though it likely doesn't yet)
        db.query(models.Profile).filter(models.Profile.user_id == user.id).delete()
        db.delete(user)
        db.commit()
        print("User deleted successfully!")
    else:
        print("User not found.")
finally:
    db.close()
