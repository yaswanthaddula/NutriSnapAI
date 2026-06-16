import os
from sqlalchemy import create_engine, MetaData, text
from dotenv import load_dotenv

load_dotenv(dotenv_path="C:\\NutriSnapApp\\backend\\.env")
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/nutrisnap"

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Dropping old tables...")
    conn.execute(text("DROP TABLE IF EXISTS reminder_statuses CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS notification_history CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS reminders CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS notification_events CASCADE;"))
    conn.commit()
    print("Done!")
