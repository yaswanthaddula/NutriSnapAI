import os
import sys
basedir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(basedir)

from database import SessionLocal
import models

db = SessionLocal()
try:
    users = db.query(models.User).all()
    print("--- REGISTERED USERS ---")
    for user in users:
        print(f"Email: {user.email}, Verified: {user.is_verified}")
    print("------------------------")
finally:
    db.close()
