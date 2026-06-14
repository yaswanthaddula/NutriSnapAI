import os
from sqlalchemy import create_engine
from models import Base
import models # ensure it's imported

NEON_URL = "postgresql://neondb_owner:npg_yWuI3RB5kOKL@ep-withered-block-aqojegw2-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"

print("Connecting to Neon...")
engine = create_engine(NEON_URL)

print("Creating all missing tables...")
Base.metadata.create_all(bind=engine)

print("Done! The reminders table should now exist in Neon.")
