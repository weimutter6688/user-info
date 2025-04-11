from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import models, schemas # Changed from relative import
from typing import List, Optional

# --- User CRUD ---

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """Gets a single user by their ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_primary_email(db: Session, email: str) -> Optional[models.User]:
    """Gets a single user by their primary email."""
    return db.query(models.User).filter(models.User.primary_email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Gets a list of users with pagination."""
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Creates a new user in the database."""
    db_user = models.User(
        full_name=user.full_name,
        birth_date=user.birth_date,
        address=user.address,
        high_school=user.high_school,
        # university and university_student_id removed
        primary_email=user.primary_email,
        remark1=user.remark1, # Add remark fields
        remark2=user.remark2,
        remark3=user.remark3
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user) # Refresh to get the generated ID

    # Add secondary emails if provided
    for sec_email_data in user.secondary_emails:
        create_secondary_email(db, sec_email_data, user_id=db_user.id)

    # Add education history if provided
    for edu_data in user.educations:
        create_education(db, education=edu_data, user_id=db_user.id)

    db.refresh(db_user) # Refresh again to load all relationships
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    """
    Updates an existing user.
    Uses a "replace all" strategy for secondary emails and educations if they are provided in the update payload.
    """
    db_user = get_user(db, user_id)
    if not db_user:
        return None

    update_data = user_update.model_dump(exclude_unset=True) # Pydantic V2

    # Update core user fields
    for key, value in update_data.items():
         # Exclude relationship fields from direct attribute setting
         if hasattr(db_user, key) and key not in ['secondary_emails', 'educations']:
            setattr(db_user, key, value)

    # Handle secondary emails update (replace all strategy)
    if user_update.secondary_emails is not None: # Check if the list was explicitly provided (even if empty)
        # Delete existing secondary emails for this user
        db.query(models.SecondaryEmail).filter(models.SecondaryEmail.user_id == user_id).delete(synchronize_session=False)
        # Add new secondary emails from the payload
        for email_data in user_update.secondary_emails:
            db_email = models.SecondaryEmail(**email_data.model_dump(), user_id=user_id)
            db.add(db_email)

    # Handle educations update (replace all strategy)
    if user_update.educations is not None: # Check if the list was explicitly provided
        # Delete existing education records for this user
        db.query(models.Education).filter(models.Education.user_id == user_id).delete(synchronize_session=False)
        # Add new education records from the payload
        for edu_data in user_update.educations:
            db_education = models.Education(**edu_data.model_dump(), user_id=user_id)
            db.add(db_education)

    db.add(db_user) # Add the user instance itself (updates core fields)
    try:
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        db.rollback() # Rollback in case of error during commit (e.g., unique constraint)
        print(f"Error updating user: {e}") # Basic error logging
        # Re-raise or handle the exception appropriately
        raise e
    return db_user

def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    """Deletes a user by their ID."""
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user

# --- Secondary Email CRUD ---

def create_secondary_email(db: Session, secondary_email: schemas.SecondaryEmailCreate, user_id: int) -> models.SecondaryEmail:
    """Creates a secondary email associated with a user."""
    db_secondary_email = models.SecondaryEmail(**secondary_email.model_dump(), user_id=user_id)
    db.add(db_secondary_email)
    db.commit()
    db.refresh(db_secondary_email)
    return db_secondary_email

def delete_secondary_email(db: Session, email_id: int) -> Optional[models.SecondaryEmail]:
    """Deletes a secondary email by its ID."""
    db_email = db.query(models.SecondaryEmail).filter(models.SecondaryEmail.id == email_id).first()
    if db_email:
        db.delete(db_email)
        db.commit()
    return db_email

# --- Education CRUD ---

def create_education(db: Session, education: schemas.EducationCreate, user_id: int) -> models.Education:
    """Creates an education record associated with a user."""
    db_education = models.Education(**education.model_dump(), user_id=user_id)
    db.add(db_education)
    db.commit()
    db.refresh(db_education)
    return db_education

def get_educations_by_user(db: Session, user_id: int) -> List[models.Education]:
    """Gets all education records for a specific user."""
    return db.query(models.Education).filter(models.Education.user_id == user_id).all()

def delete_education(db: Session, education_id: int) -> Optional[models.Education]:
    """Deletes an education record by its ID."""
    db_education = db.query(models.Education).filter(models.Education.id == education_id).first()
    if db_education:
        db.delete(db_education)
        db.commit()
    return db_education

# Optional: Add update_education function if needed

# --- Search Functionality ---

def search_users(db: Session, query: schemas.UserSearchQuery, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Searches for users based on multiple optional criteria, including education details."""
    db_query = db.query(models.User).distinct() # Use distinct to avoid duplicates when joining
    user_filters = []
    education_filters = []
    join_education = False
    join_secondary_email = False

    # User direct field filters
    if query.full_name:
        user_filters.append(models.User.full_name.ilike(f"%{query.full_name}%"))
    if query.primary_email:
        user_filters.append(models.User.primary_email.ilike(f"%{query.primary_email}%"))
    if query.high_school: # Keep high_school search on User if it remains there
         user_filters.append(models.User.high_school.ilike(f"%{query.high_school}%"))

    # Education related filters (require join)
    if query.institution_name:
        education_filters.append(models.Education.institution_name.ilike(f"%{query.institution_name}%"))
        join_education = True
    if query.institution_type:
        education_filters.append(models.Education.institution_type.ilike(f"%{query.institution_type}%"))
        join_education = True
    # Note: Searching by student_id in education might need adding it to UserSearchQuery schema first

    # Secondary email filter (requires join)
    if query.secondary_email:
        join_secondary_email = True
        # Filter will be applied after join

    # Apply joins if needed
    if join_education:
        db_query = db_query.join(models.Education, models.User.id == models.Education.user_id)
    if join_secondary_email:
        # Avoid joining twice if already joined for education search (though SQLAlchemy might handle this)
        # A simple check:
        if not join_education: # Or check if SecondaryEmail is already part of the query's joined entities
             db_query = db_query.join(models.SecondaryEmail, models.User.id == models.SecondaryEmail.user_id)
        else:
             # If Education is already joined, we might need an outer join for secondary email
             # or ensure the join condition is correct if joining multiple tables.
             # For simplicity here, assume separate joins or adjust based on specific needs.
             # Let's try joining it anyway, SQLAlchemy might optimize.
             db_query = db_query.join(models.SecondaryEmail, models.User.id == models.SecondaryEmail.user_id)


    # Apply filters
    if user_filters:
        db_query = db_query.filter(and_(*user_filters))
    if education_filters:
        db_query = db_query.filter(and_(*education_filters))
    if query.secondary_email: # Apply secondary email filter after join
        db_query = db_query.filter(models.SecondaryEmail.email.ilike(f"%{query.secondary_email}%"))


    return db_query.offset(skip).limit(limit).all()