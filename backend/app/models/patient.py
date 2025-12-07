"""Patient model for storing patient information."""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Boolean, Text, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base


class Patient(Base):
    """
    Patient model for psychologists' patient records.
    
    Includes support for minors with required tutor information.
    """
    __tablename__ = "patients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    appointment_reason = Column(Text, nullable=True)
    
    # Tutor information (required for minors < 16 years old)
    tutor_name = Column(String, nullable=True)
    tutor_phone = Column(String, nullable=True)
    tutor_email = Column(String, nullable=True)
    tutor_relationship = Column(String, nullable=True)  # e.g., "parent", "guardian"
    
    # Soft delete flag
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Foreign key to psychologist who created this patient
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    creator = relationship("User", back_populates="patients", foreign_keys=[created_by])
    entities = relationship("PatientEntity", back_populates="patient", cascade="all, delete-orphan")
    
    @property
    def is_minor(self) -> bool:
        """Calculate if patient is a minor (< 16 years old)."""
        if not self.date_of_birth:
            return False
        today = date.today()
        age = today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
        return age < 16
    
    @property
    def age(self) -> int:
        """Calculate patient's current age."""
        if not self.date_of_birth:
            return 0
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    @property
    def full_name(self) -> str:
        """Get patient's full name."""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<Patient {self.full_name} (ID: {self.id})>"
