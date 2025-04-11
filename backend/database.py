import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from databases import Database

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./user_info.db") # Default to aiosqlite scheme

# Determine connect_args based on DB type
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False} # Needed only for SQLite

# SQLAlchemy setup
engine = create_engine(
    DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Databases library setup (for async)
# Ensure the URL scheme is compatible with 'databases' library
# For SQLite, it expects 'sqlite+aiosqlite://...'
# For PostgreSQL, it expects 'postgresql+asyncpg://...'
# The getenv default above already sets the SQLite scheme correctly.
# Users need to ensure their POSTGRESQL_DATABASE_URL uses the 'postgresql+asyncpg://' scheme.
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