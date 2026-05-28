from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/nutrisnap")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def verify_user(email):
    with engine.connect() as conn:
        result = conn.execute(text("UPDATE users SET is_verified = 1 WHERE email = :email"), {"email": email})
        conn.commit()
        print(f"Verified user: {email}. Rows affected: {result.rowcount}")

if __name__ == "__main__":
    verify_user("testuser@gmail.com")
