import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from databases import Database

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./user_info.db")

# SQLAlchemy setup
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} # Needed for SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Databases library setup (for async)
database = Database(DATABASE_URL, force_rollback=False) # Set force_rollback=True for testing if needed

def get_db():
    """Dependency to get a SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def connect_db():
    """Connect the 'databases' library."""
    await database.connect()

async def disconnect_db():
    """Disconnect the 'databases' library."""
    await database.disconnect()

def create_db_and_tables():
    """Creates database tables based on SQLAlchemy models."""
    # This is typically called once at application startup
    # In a real app, you might use Alembic for migrations
    Base.metadata.create_all(bind=engine)