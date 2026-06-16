import os
from sqlalchemy import text
from database import engine, Base
import models # Make sure models are loaded

def run_migration():
    print("Starting database migration for reminders...")
    
    try:
        with engine.begin() as conn:
            print("Dropping old tables...")
            conn.execute(text("DROP TABLE IF EXISTS reminder_statuses CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS notification_history CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS reminders CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS remainder_status CASCADE;")) # Just in case
            
        print("Creating new tables...")
        Base.metadata.create_all(engine)
        
        print("Migration successful!")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
