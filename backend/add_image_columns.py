import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment variables.")
    exit(1)

# Ensure the driver is postgresql (SQLAlchemy requires postgresql:// instead of postgres://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def add_columns():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN profile_image_url TEXT;"))
            print("Successfully added profile_image_url to users table.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column profile_image_url already exists in users table.")
            else:
                print(f"Error adding to users table: {e}")

        try:
            conn.execute(text("ALTER TABLE meals ADD COLUMN meal_image_url TEXT;"))
            print("Successfully added meal_image_url to meals table.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column meal_image_url already exists in meals table.")
            else:
                print(f"Error adding to meals table: {e}")

if __name__ == "__main__":
    add_columns()
