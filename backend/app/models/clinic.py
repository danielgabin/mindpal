"""Clinic model representing medical clinics."""

import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Clinic(Base):
    """
    Clinic model representing medical facilities.
    
    Multiple users (psychologists) can belong to the same clinic.
    Each clinic has a primary contact person.
    """
    __tablename__ = "clinics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    address = Column(String, nullable=True)
    
    # Primary contact (must be a user in the system)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    contact = relationship("User", foreign_keys=[contact_id], post_update=True)
    users = relationship("User", back_populates="clinic", foreign_keys="User.clinic_id")
    
    def __repr__(self):
        return f"<Clinic {self.name}>"
