"""
User service for profile management operations.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserUpdate, UserPasswordUpdate
from app.core.security import hash_password, verify_password


class UserService:
    """Service class for user management operations."""
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> User:
        """
        Get user by ID.
        
        Args:
            db: Database session
            user_id: User UUID
            
        Returns:
            User instance
            
        Raises:
            HTTPException: If user not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    
    @staticmethod
    def update_user(db: Session, user_id: str, user_data: UserUpdate) -> User:
        """
        Update user profile.
        
        Args:
            db: Database session
            user_id: User UUID
            user_data: Updated user data
            
        Returns:
            Updated user instance
            
        Raises:
            HTTPException: If user not found or email already exists
        """
        user = UserService.get_user_by_id(db, user_id)
        
        # Check if email is being changed and if it's already in use
        if user_data.email and user_data.email != user.email:
            existing_user = db.query(User).filter(User.email == user_data.email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            user.email = user_data.email
        
        # Update full name if provided
        if user_data.full_name:
            user.full_name = user_data.full_name
        
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def change_password(
        db: Session,
        user_id: str,
        password_data: UserPasswordUpdate
    ) -> None:
        """
        Change user password.
        
        Args:
            db: Database session
            user_id: User UUID
            password_data: Current and new passwords
            
        Raises:
            HTTPException: If current password is incorrect
        """
        user = UserService.get_user_by_id(db, user_id)
        
        # Verify current password
        if not verify_password(password_data.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        user.password_hash = hash_password(password_data.new_password)
        db.commit()
