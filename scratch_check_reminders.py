import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("C:/NutriSnapApp/backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL")
    exit(1)

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT id, user_id, reminder_type, is_enabled FROM reminders")
    rows = cur.fetchall()
    print(f"Total reminders in DB: {len(rows)}")
    for r in rows:
        print(f"ID={r[0]} USER={r[1]} TYPE={r[2]} ENABLED={r[3]}")
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
