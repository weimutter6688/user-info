from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    birth_date = Column(Date) # SQLite stores DATE as TEXT or REAL or INTEGER
    address = Column(Text)
    high_school = Column(String, nullable=True)
    # university and university_student_id removed, moved to Education model
    primary_email = Column(String, unique=True, index=True)
    remark1 = Column(Text, nullable=True) # Added remark field 1
    remark2 = Column(Text, nullable=True) # Added remark field 2
    remark3 = Column(Text, nullable=True) # Added remark field 3

    # Relationship to secondary emails
    secondary_emails = relationship("SecondaryEmail", back_populates="user", cascade="all, delete-orphan")
    # Relationship to education history
    educations = relationship("Education", back_populates="user", cascade="all, delete-orphan")

class SecondaryEmail(Base):
    __tablename__ = "secondary_emails"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    email = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)

    # Relationship back to the user
    user = relationship("User", back_populates="secondary_emails")

# New table for Education History
class Education(Base):
    __tablename__ = "educations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    institution_name = Column(String, nullable=False) # e.g., University Name, High School Name
    student_id = Column(String, nullable=True) # Optional student ID
    institution_type = Column(String, nullable=True) # e.g., 'University', 'HighSchool'
    # Optional: Add start_date, end_date, degree, etc.

    # Relationship back to the user
    user = relationship("User", back_populates="educations")