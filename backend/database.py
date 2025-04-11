import os
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession # Import async engine creator
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from databases import Database # Keep for existing async query patterns if any, or remove if fully switching to SQLAlchemy async

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./user_info.db") # Default to aiosqlite scheme

# Determine connect_args based on DB type
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False} # Needed only for SQLite

# SQLAlchemy setup
# Synchronous engine (potentially for Alembic or specific sync tasks)
# Note: SessionLocal created here is SYNC, suitable for FastAPI Depends
engine = create_engine(
    DATABASE_URL.replace("+asyncpg", "").replace("+aiosqlite", ""), # Sync engine needs non-async dialect
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) # Sync Session
Base = declarative_base()

# Asynchronous engine (for async operations like table creation)
async_engine = create_async_engine(DATABASE_URL)

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

# def create_db_and_tables(): # Keep original sync version commented out or remove
#     """Synchronous table creation (DO NOT USE WITH ASYNC ENGINE STARTUP)."""
#     print("Running SYNC create_db_and_tables (likely incorrect for async setup)")
#     Base.metadata.create_all(bind=engine) # Uses the sync engine

async def async_create_db_and_tables():
    """Creates database tables asynchronously using the async engine."""
    async with async_engine.begin() as conn:
        # Use run_sync to execute the synchronous metadata.create_all within the async context
        # Use checkfirst=True to avoid errors if tables already exist
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    # Optional: Dispose the engine if it's only used for startup
    # await async_engine.dispose()