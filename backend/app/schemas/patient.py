"""Pydantic schemas for patient-related operations."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from uuid import UUID


class PatientBase(BaseModel):
    """Base schema for patient data."""
    first_name: str
    last_name: str
    date_of_birth: date
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    appointment_reason: Optional[str] = None
    tutor_name: Optional[str] = None
    tutor_phone: Optional[str] = None
    tutor_email: Optional[EmailStr] = None
    tutor_relationship: Optional[str] = None


class PatientCreate(PatientBase):
    """Schema for creating a new patient."""
    
    @field_validator('date_of_birth')
    @classmethod
    def validate_date_of_birth(cls, v: date) -> date:
        """Ensure date of birth is not in the future."""
        if v > date.today():
            raise ValueError('Date of birth cannot be in the future')
        return v
    
    @model_validator(mode='after')
    def validate_tutor_fields(self):
        """Validate that tutor fields are present for minors (<16 years old)."""
        # Calculate age
        today = date.today()
        age = today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
        
        # If minor, require tutor information
        if age < 16:
            if not self.tutor_name:
                raise ValueError('Tutor name is required for patients under 16 years old')
            if not self.tutor_phone:
                raise ValueError('Tutor phone is required for patients under 16 years old')
            if not self.tutor_relationship:
                raise ValueError('Tutor relationship is required for patients under 16 years old')
        
        return self


class PatientUpdate(BaseModel):
    """Schema for updating a patient (all fields optional)."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    appointment_reason: Optional[str] = None
    tutor_name: Optional[str] = None
    tutor_phone: Optional[str] = None
    tutor_email: Optional[EmailStr] = None
    tutor_relationship: Optional[str] = None
    is_active: Optional[bool] = None
    
    @field_validator('date_of_birth')
    @classmethod
    def validate_date_of_birth(cls, v: Optional[date]) -> Optional[date]:
        """Ensure date of birth is not in the future."""
        if v and v > date.today():
            raise ValueError('Date of birth cannot be in the future')
        return v


class PatientResponse(PatientBase):
    """Schema for patient response with computed fields."""
    id: UUID
    is_minor: bool
    age: int
    full_name: str
    is_active: bool
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PatientListItem(BaseModel):
    """Simplified patient schema for list views."""
    id: UUID
    first_name: str
    last_name: str
    full_name: str
    age: int
    is_minor: bool
    email: Optional[str]
    phone: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class PatientEntityCreate(BaseModel):
    """Schema for creating a patient entity."""
    type: str  # 'symptom', 'medication', or 'feeling'
    value: str
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v: str) -> str:
        """Validate entity type."""
        valid_types = ['symptom', 'medication', 'feeling']
        if v not in valid_types:
            raise ValueError(f'Type must be one of: {", ".join(valid_types)}')
        return v
    
    @field_validator('value')
    @classmethod
    def validate_value(cls, v: str) -> str:
        """Validate value is not empty."""
        if not v or not v.strip():
            raise ValueError('Value cannot be empty')
        return v.strip()


class PatientEntityResponse(BaseModel):
    """Schema for patient entity response."""
    id: UUID
    patient_id: UUID
    type: str
    value: str
    created_by: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
