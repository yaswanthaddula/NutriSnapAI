import os
import sys
basedir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(basedir)

from database import SessionLocal
import models
import auth
from datetime import datetime

db = SessionLocal()
try:
    email = "kurubabalaji8@gmail.com"
    existing = db.query(models.User).filter(models.User.email == email).first()
    if not existing:
        print(f"Creating user {email}...")
        new_user = models.User(
            name="Balaji",
            email=email,
            password_hash=auth.get_password_hash("password123"),
            is_verified=1,
            created_at=datetime.utcnow()
        )
        db.add(new_user)
        db.commit()
        print("User created successfully!")
    else:
        print("User already exists.")
finally:
    db.close()
