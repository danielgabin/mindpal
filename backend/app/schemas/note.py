"""Pydantic schemas for clinical notes and versions."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from uuid import UUID


class NoteBase(BaseModel):
    """Base schema for note data."""
    title: str
    content_markdown: str
    kind: str  # 'conceptualization', 'followup', 'split'
    parent_note_id: Optional[UUID] = None


class NoteCreate(NoteBase):
    """Schema for creating a new note."""
    patient_id: UUID
    
    @field_validator('kind')
    @classmethod
    def validate_kind(cls, v: str) -> str:
        """Validate note kind."""
        valid_kinds = ['conceptualization', 'followup', 'split']
        if v not in valid_kinds:
            raise ValueError(f'Kind must be one of: {", ".join(valid_kinds)}')
        return v
    
    @field_validator('parent_note_id')
    @classmethod
    def validate_parent_note_id(cls, v: Optional[UUID], info) -> Optional[UUID]:
        """Validate parent_note_id is only set for split notes."""
        kind = info.data.get('kind')
        if kind == 'split' and not v:
            raise ValueError('parent_note_id is required for split notes')
        if kind != 'split' and v:
            raise ValueError('parent_note_id should only be set for split notes')
        return v


class NoteUpdate(BaseModel):
    """Schema for updating a note (all fields optional)."""
    title: Optional[str] = None
    content_markdown: Optional[str] = None


class NoteResponse(NoteBase):
    """Schema for note response with computed fields."""
    id: UUID
    patient_id: UUID
    author_id: UUID
    created_at: datetime
    updated_at: datetime
    current_version: int  # Computed from versions count
    
    class Config:
        from_attributes = True


class NoteListItem(BaseModel):
    """Simplified note schema for list views."""
    id: UUID
    title: str
    kind: str
    patient_id: UUID
    author_id: UUID
    created_at: datetime
    updated_at: datetime
    version_count: int  # Computed
    
    class Config:
        from_attributes = True


class NoteVersionResponse(BaseModel):
    """Schema for note version response."""
    id: UUID
    note_id: UUID
    editor_id: UUID
    content_markdown: str
    version_number: int
    created_at: datetime
    
    class Config:
        from_attributes = True
