"""Pydantic schemas for user-related requests and responses."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str
    role: str = "psychologist"  # Default to psychologist


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserPasswordUpdate(BaseModel):
    """Schema for password change."""
    current_password: str
    new_password: str


class UserResponse(UserBase):
    """Schema for user data in responses."""
    id: UUID
    role: str
    is_active: bool
    clinic_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserResponse):
    """User schema including password hash (for internal use)."""
    password_hash: str
