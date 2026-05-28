import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/nutrisnap")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def list_users():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, name, email, is_verified FROM users"))
        users = result.fetchall()
        print("Existing Users:")
        for u in users:
            print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Verified: {u.is_verified}")

if __name__ == "__main__":
    list_users()
