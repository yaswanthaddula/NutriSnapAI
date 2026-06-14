import os
from sqlalchemy import create_engine
from models import Base
import models # ensure it's imported

LOCAL_URL = "postgresql://postgres:postgreSQL%40123@localhost:5432/nutrisnap"

print("Connecting to Local PostgreSQL...")
try:
    engine = create_engine(LOCAL_URL)
    print("Creating all missing tables...")
    Base.metadata.create_all(bind=engine)
    print("Done! The reminders table should now exist in your local PostgreSQL 18.")
except Exception as e:
    print(f"Error: {e}")
