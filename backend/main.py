import os # Import os module
from dotenv import load_dotenv # Import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

import crud, models, schemas, database # Changed from relative import
from database import SessionLocal, engine, async_create_db_and_tables, connect_db, disconnect_db # Import the new async function

# Load environment variables from .env file
# This should be one of the first things your application does.
# It will load variables from a .env file in the current directory or parent directories.
load_dotenv()

# Database table creation is moved to the startup event handler
# to ensure it runs within the async context when using async drivers.
# create_db_and_tables() # DO NOT CALL HERE AT MODULE LEVEL

app = FastAPI(title="User Info API", description="API for managing user information and emails.")

# --- Event Handlers ---

@app.on_event("startup")
async def startup_event():
    """Connect to database on startup."""
    await connect_db()
    # Create tables if they don't exist (safe to call multiple times)
    # This ensures tables are created after the DB connection is established
    # and within the async context.
    print("Creating database tables if they don't exist...")
    await async_create_db_and_tables() # Call the async version
    print("Database tables checked/created.")

@app.on_event("shutdown")
async def shutdown_event():
    """Disconnect from database on shutdown."""
    await disconnect_db()

# --- Middleware (Example: CORS) ---
from fastapi.middleware.cors import CORSMiddleware

# Configure CORS (Cross-Origin Resource Sharing)
# Adjust origins based on your frontend's URL in development/production
origins = [
    "http://localhost",      # Allow localhost for development
    "http://localhost:3000", # Default Next.js dev port
    # Add your frontend production URL here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"], # Allow all headers
)


# --- Dependency ---
def get_db():
    """Dependency to get a database session for each request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- API Endpoints ---

# -- Users --

@app.post("/api/users/", response_model=schemas.User, status_code=status.HTTP_201_CREATED, tags=["Users"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.
    Optionally include secondary emails in the request body.
    """
    db_user = crud.get_user_by_primary_email(db, email=user.primary_email)
    if db_user:
        raise HTTPException(status_code=400, detail="Primary email already registered")
    # Check secondary emails for uniqueness across all users if needed (more complex query)
    return crud.create_user(db=db, user=user)

@app.get("/api/users/", response_model=List[schemas.User], tags=["Users"])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of users with pagination.
    """
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@app.get("/api/users/search/", response_model=List[schemas.User], tags=["Users"])
def search_users_endpoint(
    full_name: Optional[str] = Query(None, description="Search by partial full name (case-insensitive)"),
    # university: Optional[str] = Query(None, description="Search by partial university name (case-insensitive)"), # Removed
    # university_student_id: Optional[str] = Query(None, description="Search by partial university student ID (case-insensitive)"), # Removed
    institution_name: Optional[str] = Query(None, description="Search by partial institution name (case-insensitive, searches educations)"),
    institution_type: Optional[str] = Query(None, description="Search by partial institution type (case-insensitive, e.g., 'University', 'HighSchool')"),
    primary_email: Optional[str] = Query(None, description="Search by partial primary email (case-insensitive)"),
    secondary_email: Optional[str] = Query(None, description="Search by partial secondary email (case-insensitive)"),
    high_school: Optional[str] = Query(None, description="Search by partial high school name (case-insensitive)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Search for users based on various criteria. All criteria are optional and combined with AND.
    Uses case-insensitive partial matching.
    """
    search_query = schemas.UserSearchQuery(
        full_name=full_name,
        # university=university, # Removed
        # university_student_id=university_student_id, # Removed
        institution_name=institution_name,
        institution_type=institution_type,
        primary_email=primary_email,
        secondary_email=secondary_email,
        high_school=high_school
    )
    users = crud.search_users(db, query=search_query, skip=skip, limit=limit)
    return users


@app.get("/api/users/{user_id}", response_model=schemas.User, tags=["Users"])
def read_user(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single user by their ID.
    """
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.put("/api/users/{user_id}", response_model=schemas.User, tags=["Users"])
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    """
    Update an existing user's details. Only provided fields will be updated.
    """
    db_user = crud.update_user(db=db, user_id=user_id, user_update=user_update)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    # Add check for primary email uniqueness if it's being updated
    if user_update.primary_email:
        existing_user = crud.get_user_by_primary_email(db, email=user_update.primary_email)
        if existing_user and existing_user.id != user_id:
             # Rollback or handle the update failure due to email conflict
             # This might require more careful transaction handling depending on complexity
             raise HTTPException(status_code=400, detail="Primary email already registered by another user")
    return db_user

@app.delete("/api/users/{user_id}", response_model=schemas.User, tags=["Users"])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Delete a user by their ID. This will also delete associated secondary emails due to cascade settings.
    """
    db_user = crud.delete_user(db=db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# -- Secondary Emails --

@app.post("/api/users/{user_id}/secondary_emails/", response_model=schemas.SecondaryEmail, status_code=status.HTTP_201_CREATED, tags=["Secondary Emails"])
def create_secondary_email_for_user(
    user_id: int, secondary_email: schemas.SecondaryEmailCreate, db: Session = Depends(get_db)
):
    """
    Add a new secondary email address for a specific user.
    """
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    # Add check for email uniqueness across all secondary emails if needed
    return crud.create_secondary_email(db=db, secondary_email=secondary_email, user_id=user_id)

@app.delete("/api/secondary_emails/{email_id}", response_model=schemas.SecondaryEmail, tags=["Secondary Emails"])
def delete_secondary_email(email_id: int, db: Session = Depends(get_db)):
    """
    Delete a secondary email by its own ID.
    """
    db_email = crud.delete_secondary_email(db=db, email_id=email_id)
    if db_email is None:
        raise HTTPException(status_code=404, detail="Secondary email not found")
    return db_email

# -- Education --

@app.post("/api/users/{user_id}/educations/", response_model=schemas.Education, status_code=status.HTTP_201_CREATED, tags=["Education"])
def create_education_for_user(
    user_id: int, education: schemas.EducationCreate, db: Session = Depends(get_db)
):
    """
    Add a new education record (e.g., university, high school) for a specific user.
    """
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.create_education(db=db, education=education, user_id=user_id)

@app.delete("/api/educations/{education_id}", response_model=schemas.Education, tags=["Education"])
def delete_education(education_id: int, db: Session = Depends(get_db)):
    """
    Delete an education record by its own ID.
    """
    db_education = crud.delete_education(db=db, education_id=education_id)
    if db_education is None:
        raise HTTPException(status_code=404, detail="Education record not found")
    return db_education

# Optional: Add endpoint to get all educations for a user
# @app.get("/api/users/{user_id}/educations/", response_model=List[schemas.Education], tags=["Education"])
# def read_user_educations(user_id: int, db: Session = Depends(get_db)):
#     """ Retrieve all education records for a specific user. """
#     db_user = crud.get_user(db, user_id=user_id)
#     if not db_user:
#         raise HTTPException(status_code=404, detail="User not found")
#     return crud.get_educations_by_user(db=db, user_id=user_id)


# --- Root Endpoint ---
@app.get("/", tags=["Root"])
async def read_root():
    """Root endpoint providing basic API info."""
    return {"message": "Welcome to the User Info API. Visit /docs for documentation."}
