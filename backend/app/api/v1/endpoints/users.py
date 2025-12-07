"""
User management endpoints for profile and password operations.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserPasswordUpdate
from app.schemas.common import MessageResponse
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    
    Requires valid access token in Authorization header.
    """
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    
    - **full_name**: Updated full name (optional)
    - **email**: Updated email (optional, must be unique)
    """
    updated_user = UserService.update_user(db, str(current_user.id), user_data)
    return updated_user


@router.patch("/me/password", response_model=MessageResponse)
def change_password(
    password_data: UserPasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change current user's password.
    
    - **current_password**: User's current password
    - **new_password**: New password
    """
    UserService.change_password(db, str(current_user.id), password_data)
    return MessageResponse(message="Password successfully changed")
