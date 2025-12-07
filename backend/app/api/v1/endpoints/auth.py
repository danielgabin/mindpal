"""
Authentication endpoints for user registration, login, token refresh, and password reset.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm
)
from app.schemas.user import UserCreate, UserResponse
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (psychologist or admin).
    
    - **email**: Valid email address (must be unique)
    - **full_name**: User's full name
    - **password**: Plain text password (will be hashed)
    - **role**: Either 'psychologist' (default) or 'admin'
    """
    user = AuthService.register_user(db, user_data)
    return user


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and receive access + refresh tokens.
    
    - **email**: User email
    - **password**: User password
    
    Returns both an access token (15min expiry) and refresh token (30day expiry).
    """
    access_token, refresh_token = AuthService.authenticate_user(db, login_data)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=dict)
def refresh_token(token_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refresh access token using a valid refresh token.
    
    - **refresh_token**: Valid refresh token from login
    
    Returns a new access token.
    """
    access_token = AuthService.refresh_access_token(db, token_data.refresh_token)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout", response_model=MessageResponse)
def logout(token_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Logout user by revoking their refresh token.
    
    - **refresh_token**: Refresh token to revoke
    """
    AuthService.revoke_refresh_token(db, token_data.refresh_token)
    return MessageResponse(message="Successfully logged out")


@router.post("/password-reset-request", response_model=MessageResponse)
def request_password_reset(reset_data: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Request a password reset token.
    
    - **email**: User email
    
    Sends a password reset email (currently stubbed - logs to console).
    """
    AuthService.create_password_reset_token(db, reset_data.email)
    return MessageResponse(
        message="If the email exists, a password reset link has been sent"
    )


@router.post("/password-reset-confirm", response_model=MessageResponse)
def confirm_password_reset(reset_data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    Confirm password reset with token.
    
    - **token**: Reset token from email
    - **new_password**: New password
    """
    AuthService.reset_password(db, reset_data.token, reset_data.new_password)
    return MessageResponse(message="Password successfully reset")
