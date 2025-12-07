"""Pydantic schemas for clinic-related requests and responses."""

from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID


class ClinicBase(BaseModel):
    """Base clinic schema."""
    name: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None


class ClinicCreate(ClinicBase):
    """Schema for creating a clinic."""
    contact_id: Optional[UUID] = None


class ClinicResponse(ClinicBase):
    """Schema for clinic data in responses."""
    id: UUID
    contact_id: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)
