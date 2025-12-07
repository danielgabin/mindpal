"""Patient entity model for symptoms, medications, and feelings."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base


class EntityType(str, enum.Enum):
    """Patient entity type enumeration."""
    SYMPTOM = "symptom"
    MEDICATION = "medication"
    FEELING = "feeling"


class PatientEntity(Base):
    """
    Patient entity model for tracking symptoms, medications, and feelings.
    
    Allows psychologists to tag patients with relevant information.
    """
    __tablename__ = "patient_entities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    type = Column(String, nullable=False, index=True)  # Uses entity_type enum at DB level
    value = Column(Text, nullable=False)
    
    # Foreign key to user who created this entity
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    patient = relationship("Patient", back_populates="entities")
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<PatientEntity {self.type}: {self.value[:30]}>"
