"""Note version model for tracking edit history."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class NoteVersion(Base):
    """
    Version history for clinical notes.
    
    Every save creates a new version with incremented version_number.
    Allows viewing history and restoring previous versions.
    """
    __tablename__ = "note_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    note_id = Column(UUID(as_uuid=True), ForeignKey("notes.id"), nullable=False, index=True)
    editor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    content_markdown = Column(Text, nullable=False)
    version_number = Column(Integer, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    note = relationship("Note", back_populates="versions")
    editor = relationship("User", foreign_keys=[editor_id])
    
    def __repr__(self):
        return f"<NoteVersion v{self.version_number} for Note {self.note_id}>"
