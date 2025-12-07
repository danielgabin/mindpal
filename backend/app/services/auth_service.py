"""
Authentication service handling user registration, login, and token management.
Business logic layer between API endpoints and database models.
"""

from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.models.refresh_token import RefreshToken
from app.schemas.user import UserCreate
from app.schemas.auth import LoginRequest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_token
)
from app.core.config import settings
import secrets


class AuthService:
    """Service class for authentication operations."""
    
    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> User:
        """
        Register a new user.
        
        Args:
            db: Database session
            user_data: User registration data
            
        Returns:
            Created user instance
            
        Raises:
            HTTPException: If email already exists
        """
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate role (comparing string values)
        valid_roles = [UserRole.PSYCHOLOGIST.value, UserRole.ADMIN.value]
        if user_data.role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
        
        # Create new user
        user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            password_hash=hash_password(user_data.password),
            role=user_data.role
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest) -> tuple[str, str]:
        """
        Authenticate user and issue access + refresh tokens.
        
        Args:
            db: Database session
            login_data: Login credentials
            
        Returns:
            Tuple of (access_token, refresh_token)
            
        Raises:
            HTTPException: If credentials are invalid or user is inactive
        """
        # Find user
        user = db.query(User).filter(User.email == login_data.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Verify password
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Create tokens
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Store hashed refresh token in database
        token_hash = hash_token(refresh_token)
        expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        db_refresh_token = RefreshToken(
            token_hash=token_hash,
            user_id=user.id,
            expires_at=expires_at
        )
        db.add(db_refresh_token)
        db.commit()
        
        return access_token, refresh_token
    
    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> str:
        """
        Issue a new access token using a refresh token.
        
        Args:
            db: Database session
            refresh_token: JWT refresh token
            
        Returns:
            New access token
            
        Raises:
            HTTPException: If refresh token is invalid or revoked
        """
        # Decode refresh token
        payload = decode_refresh_token(refresh_token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Check if token exists and is not revoked
        token_hash = hash_token(refresh_token)
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()
        
        if not db_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found"
            )
        
        if db_token.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked"
            )
        
        if db_token.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired"
            )
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new access token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )
        
        return access_token
    
    @staticmethod
    def revoke_refresh_token(db: Session, refresh_token: str) -> None:
        """
        Revoke a refresh token (logout).
        
        Args:
            db: Database session
            refresh_token: JWT refresh token to revoke
            
        Raises:
            HTTPException: If token not found
        """
        token_hash = hash_token(refresh_token)
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()
        
        if not db_token:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Refresh token not found"
            )
        
        db_token.is_revoked = True
        db.commit()
    
    @staticmethod
    def create_password_reset_token(db: Session, email: str) -> str:
        """
        Create a password reset token for a user.
        
        Args:
            db: Database session
            email: User email
            
        Returns:
            Password reset token
            
        Raises:
            HTTPException: If user not found
        """
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Don't reveal that user doesn't exist for security
            # But still return a token (that won't work)
            return secrets.token_urlsafe(32)
        
        # In production, store this token with expiry in a separate table
        # For now, we'll create a simple token
        # TODO: Implement proper password reset token storage
        token = secrets.token_urlsafe(32)
        
        # Stub: Log the reset email (in production, send actual email)
        print(f"[EMAIL STUB] Password reset token for {email}: {token}")
        print(f"[EMAIL STUB] Reset link: http://localhost:3000/reset-password?token={token}")
        
        return token
    
    @staticmethod
    def reset_password(db: Session, token: str, new_password: str) -> None:
        """
        Reset user password using a reset token.
        
        Args:
            db: Database session
            token: Password reset token
            new_password: New password
            
        Raises:
            HTTPException: If token is invalid
        """
        # TODO: Implement proper token validation from database
        # For now, this is stubbed
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Password reset confirmation not implemented yet. Please use token from email stub."
        )
