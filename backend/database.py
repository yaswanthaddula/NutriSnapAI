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

# Render Postgres often uses postgres:// instead of postgresql:// which SQLAlchemy 1.4+ rejects
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Neon PostgreSQL requires SSL
connect_args = {}
if "neon.tech" in SQLALCHEMY_DATABASE_URL:
    connect_args = {"sslmode": "require"}
    if "sslmode=require" not in SQLALCHEMY_DATABASE_URL:
        if "?" in SQLALCHEMY_DATABASE_URL:
            SQLALCHEMY_DATABASE_URL += "&sslmode=require"
        else:
            SQLALCHEMY_DATABASE_URL += "?sslmode=require"

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
