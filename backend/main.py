import os # Import os module
from dotenv import load_dotenv # Import load_dotenv
import io
import csv
import codecs # Needed for reading UploadFile content as text
from fastapi import FastAPI, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import StreamingResponse, JSONResponse
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
# Read allowed origins from environment variable for flexibility and security
# The variable should contain comma-separated URLs (e.g., "http://localhost:3000,https://yourdomain.com")
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "") # Default to empty string if not set
origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# Provide a fallback for local development if ALLOWED_ORIGINS is not explicitly set
# You might want to refine this based on your local setup needs
if not origins and os.getenv("NODE_ENV", "production") == "development": # Example check
     print("Warning: ALLOWED_ORIGINS not set, falling back to default development origins.")
     origins = ["http://localhost", "http://localhost:3000", "http://127.0.0.1:3000"]

print(f"Configuring CORS with allowed origins: {origins}") # Log the origins being used

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Use the dynamically loaded list
    allow_credentials=True, # Set to True if you need cookies/auth headers (adjust frontend too)
    allow_methods=["*"],    # Allow all standard methods
    allow_headers=["*"],    # Allow all standard headers
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

# --- Data Export ---

@app.get("/api/users/export/csv", tags=["Data Export"])
def export_users_to_csv(db: Session = Depends(get_db)):
    """
    Export all user data (including secondary emails and educations) to a CSV file.
    """
    all_users = crud.get_all_users(db) # Use the new function

    output = io.StringIO()
    # Define CSV header - adjust based on the exact fields you want to export
    # Including nested data requires careful handling. Here's a basic example.
    # You might want separate exports for related tables or flatten the structure.
    fieldnames = [
        'id', 'full_name', 'birth_date', 'address', 'high_school',
        'primary_email', 'remark1', 'remark2', 'remark3',
        'secondary_emails', # Flattened list
        'educations' # Flattened list (example: "Type: Name (Degree) Start-End")
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for user in all_users:
        # Flatten secondary emails
        secondary_emails_str = ", ".join([email.email for email in user.secondary_emails])

        # Flatten education history (example format)
        educations_str_list = []
        for edu in user.educations:
            edu_str = f"{edu.institution_type or 'N/A'}: {edu.institution_name or 'N/A'}"
            if edu.degree:
                edu_str += f" ({edu.degree})"
            if edu.start_date or edu.end_date:
                 start = edu.start_date.strftime('%Y-%m-%d') if edu.start_date else '?'
                 end = edu.end_date.strftime('%Y-%m-%d') if edu.end_date else 'Present'
                 edu_str += f" [{start} - {end}]"
            educations_str_list.append(edu_str)
        educations_str = "; ".join(educations_str_list)


        writer.writerow({
            'id': user.id,
            'full_name': user.full_name,
            'birth_date': user.birth_date.strftime('%Y-%m-%d') if user.birth_date else None,
            'address': user.address,
            'high_school': user.high_school,
            'primary_email': user.primary_email,
            'remark1': user.remark1,
            'remark2': user.remark2,
            'remark3': user.remark3,
            'secondary_emails': secondary_emails_str,
            'educations': educations_str
        })

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users_export.csv"}
    )
    return response


# --- Data Import ---

@app.post("/api/users/import/csv", tags=["Data Import"])
async def import_users_from_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import users from a CSV file.
    Assumes CSV header matches the UserCreate schema fields (or a subset).
    Skips users if primary_email already exists.
    Required columns: primary_email, full_name. Others are optional.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    imported_count = 0
    skipped_count = 0
    errors = []

    try:
        # Read the file content asynchronously and decode it
        # Use codecs.iterdecode for robust handling of streaming data
        content_stream = codecs.iterdecode(file.file, 'utf-8')
        csv_reader = csv.DictReader(content_stream)

        # Check for required headers (adjust as needed)
        required_headers = {'primary_email', 'full_name'}
        if not required_headers.issubset(csv_reader.fieldnames):
             missing = required_headers - set(csv_reader.fieldnames)
             raise HTTPException(status_code=400, detail=f"Missing required CSV columns: {', '.join(missing)}")


        for row_index, row in enumerate(csv_reader):
            try:
                # Basic validation: Check if primary_email exists
                primary_email = row.get('primary_email')
                if not primary_email:
                    errors.append(f"Row {row_index + 2}: Missing primary_email")
                    skipped_count += 1
                    continue # Skip row if essential info is missing

                # Check if user already exists
                existing_user = crud.get_user_by_primary_email(db, email=primary_email)
                if existing_user:
                    # errors.append(f"Row {row_index + 2}: User with primary_email '{primary_email}' already exists. Skipping.")
                    skipped_count += 1
                    continue # Skip existing user

                # Prepare user data - handle potential missing optional fields gracefully
                # Convert empty strings to None where appropriate (e.g., for date)
                birth_date_str = row.get('birth_date')
                birth_date = birth_date_str if birth_date_str else None

                # TODO: Handle secondary_emails and educations if they are in the CSV
                # This requires parsing potentially complex string formats (like the one used for export)
                # For now, we only import core user fields.

                user_data = schemas.UserCreate(
                    full_name=row.get('full_name', 'N/A'), # Provide default or raise error if required
                    primary_email=primary_email,
                    birth_date=birth_date,
                    address=row.get('address'),
                    high_school=row.get('high_school'),
                    remark1=row.get('remark1'),
                    remark2=row.get('remark2'),
                    remark3=row.get('remark3'),
                    secondary_emails=[], # Placeholder - not importing these from CSV yet
                    educations=[] # Placeholder - not importing these from CSV yet
                )

                crud.create_user(db=db, user=user_data)
                imported_count += 1

            except HTTPException as e: # Catch validation errors from Pydantic/Schema
                 errors.append(f"Row {row_index + 2} (Email: {primary_email}): Validation Error - {e.detail}")
                 skipped_count += 1
            except Exception as e:
                errors.append(f"Row {row_index + 2} (Email: {primary_email}): Error processing row - {str(e)}")
                skipped_count += 1
                db.rollback() # Rollback potentially partial changes for this user if create_user failed mid-way

    except Exception as e:
        # Catch errors during file reading or initial CSV parsing
        raise HTTPException(status_code=500, detail=f"Error processing CSV file: {str(e)}")
    finally:
        await file.close() # Ensure the file is closed

    return JSONResponse(
        status_code=200,
        content={
            "message": f"Import finished. Imported: {imported_count}, Skipped/Errors: {skipped_count}",
            "errors": errors[:50] # Limit the number of errors returned
        }
    )


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
