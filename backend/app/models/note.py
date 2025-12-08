"""Note model for clinical notes with versioning support."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base


class NoteKind(str, enum.Enum):
    """Note type enumeration."""
    CONCEPTUALIZATION = "conceptualization"
    FOLLOWUP = "followup"
    SPLIT = "split"


class Note(Base):
    """
    Clinical note model for documenting patient cases.
    
    Supports three types:
    - Conceptualization: Initial patient assessment
    - Follow-up: Session notes after initial
    - Split: Generated from conceptualization, linked via parent_note_id
    
    All edits create new versions in NoteVersion table.
    """
    __tablename__ = "notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    parent_note_id = Column(UUID(as_uuid=True), ForeignKey("notes.id"), nullable=True, index=True)
    
    kind = Column(String, nullable=False, index=True)  # Uses note_kind enum at DB level
    title = Column(String, nullable=False)
    content_markdown = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="notes", foreign_keys=[patient_id])
    author = relationship("User", back_populates="notes", foreign_keys=[author_id])
    
    # Self-referential for split notes
    parent_note = relationship("Note", remote_side=[id], backref="split_notes", foreign_keys=[parent_note_id])
    
    # Versions
    versions = relationship("NoteVersion", back_populates="note", cascade="all, delete-orphan", order_by="desc(NoteVersion.version_number)")
    
    @property
    def current_version(self) -> int:
        """Get current version number (count of versions)."""
        return len(self.versions) if self.versions else 0
    
    def __repr__(self):
        return f"<Note {self.title} ({self.kind})>"
