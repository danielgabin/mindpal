"""Template model for clinical note templates."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Template(Base):
    """
    Template model for clinical notes.
    
    Can be system default (owner_id=None, is_default=True)
    or user custom templates (owner_id=User.id).
    """
    __tablename__ = "templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    content_markdown = Column(Text, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    owner = relationship("User", backref="templates", foreign_keys=[owner_id])
    
    def __repr__(self):
        return f"<Template {self.name} (Default: {self.is_default})>"
