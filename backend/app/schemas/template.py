"""Pydantic schemas for templates."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from uuid import UUID


class TemplateBase(BaseModel):
    """Base schema for template data."""
    name: str
    content_markdown: str
    is_default: bool = False


class TemplateCreate(TemplateBase):
    """Schema for creating a new template."""
    pass


class TemplateUpdate(BaseModel):
    """Schema for updating a template."""
    name: Optional[str] = None
    content_markdown: Optional[str] = None
    is_default: Optional[bool] = None


class TemplateResponse(TemplateBase):
    """Schema for template response."""
    id: UUID
    owner_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
