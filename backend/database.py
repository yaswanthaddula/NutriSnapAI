import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Read DATABASE_URL from environment
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/nutrisnap"
)

# Neon PostgreSQL requires SSL — add connect_args for cloud deployment
connect_args = {}
if "neon.tech" in SQLALCHEMY_DATABASE_URL or "sslmode" not in SQLALCHEMY_DATABASE_URL:
    if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
        connect_args = {"sslmode": "require"}

# Create engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,       # Detects stale connections
    pool_recycle=300,         # Recycle connections every 5 minutes
    pool_size=5,
    max_overflow=10,
)

# Verify connection on startup
try:
    with engine.connect() as connection:
        print("--- DATABASE: Neon PostgreSQL connected successfully ---")
except Exception as e:
    print(f"--- DATABASE: Connection failed: {e} ---")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
