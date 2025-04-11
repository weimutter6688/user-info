from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import List, Optional
from datetime import date

# --- Secondary Email Schemas ---

class SecondaryEmailBase(BaseModel):
    email: EmailStr
    description: Optional[str] = None

class SecondaryEmailCreate(SecondaryEmailBase):
    pass # No extra fields needed for creation beyond base

class SecondaryEmail(SecondaryEmailBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True # Pydantic V2 uses this instead of orm_mode

# --- Education Schemas ---

class EducationBase(BaseModel):
    institution_name: str
    student_id: Optional[str] = None
    institution_type: Optional[str] = None # e.g., 'University', 'HighSchool'
    # Add other fields like start_date, end_date, degree if needed

class EducationCreate(EducationBase):
    pass # No extra fields needed for creation

class Education(EducationBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# --- User Schemas ---

class UserBase(BaseModel):
    full_name: str
    birth_date: date
    address: str
    high_school: Optional[str] = None
    # university and university_student_id removed
    primary_email: EmailStr
    remark1: Optional[str] = None
    remark2: Optional[str] = None
    remark3: Optional[str] = None

class UserCreate(UserBase):
    secondary_emails: List[SecondaryEmailCreate] = [] # Allow creating user with secondary emails
    educations: List[EducationCreate] = [] # Allow creating user with education history
    # Removed university_student_id validator

class UserUpdate(BaseModel):
    # All fields are optional for updates
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None
    high_school: Optional[str] = None
    # university and university_student_id removed
    # Note: Updating educations might need a separate endpoint or more complex logic
    primary_email: Optional[EmailStr] = None
    remark1: Optional[str] = None
    remark2: Optional[str] = None
    remark3: Optional[str] = None
    secondary_emails: Optional[List[SecondaryEmailCreate]] = None # Allow updating secondary emails
    educations: Optional[List[EducationCreate]] = None # Allow updating educations
    # Note: Updating secondary emails might need a separate endpoint or more complex logic here

class User(UserBase):
    id: int
    secondary_emails: List[SecondaryEmail] = []
    educations: List[Education] = [] # Include education history when reading a user

    class Config:
        from_attributes = True # Pydantic V2 uses this instead of orm_mode

# --- Search Schemas ---
# Optional: Define specific schemas for search parameters if needed
class UserSearchQuery(BaseModel):
    full_name: Optional[str] = None
    # university and university_student_id removed from direct user search
    institution_name: Optional[str] = None # Search by institution name in educations
    institution_type: Optional[str] = None # Search by institution type in educations
    primary_email: Optional[EmailStr] = None
    secondary_email: Optional[EmailStr] = None # Search by secondary email
    high_school: Optional[str] = None
    # Add other searchable fields as needed