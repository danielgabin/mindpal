"""Refresh token model for revocable JWT refresh tokens."""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class RefreshToken(Base):
    """
    Refresh token model for storing hashed refresh tokens.
    
    Enables token revocation by storing tokens in the database.
    Tokens are stored hashed for security.
    """
    __tablename__ = "refresh_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Hashed token value (SHA-256 hash of the actual JWT)
    token_hash = Column(String, nullable=False, index=True, unique=True)
    
    # User who owns this token
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Token metadata
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
    
    def __repr__(self):
        return f"<RefreshToken {self.id} (revoked={self.is_revoked})>"
