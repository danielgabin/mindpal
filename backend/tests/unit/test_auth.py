"""Unit tests for authentication functionality."""

import pytest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_token
)


def test_password_hashing():
    """Test password hashing and verification."""
    password = "SecurePassword123!"
    hashed = hash_password(password)
    
    # Hash should be different from original password
    assert hashed != password
    
    # Should verify correctly
    assert verify_password(password, hashed) is True
    
    # Should reject incorrect password
    assert verify_password("WrongPassword", hashed) is False


def test_access_token_creation_and_validation():
    """Test creating and validating access tokens."""
    payload = {"sub": "user-123", "email": "test@example.com", "role": "psychologist"}
    token = create_access_token(payload)
    
    # Token should be a non-empty string
    assert isinstance(token, str)
    assert len(token) > 0
    
    # Should decode successfully
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-123"
    assert decoded["email"] == "test@example.com"
    assert decoded["role"] == "psychologist"
    assert decoded["type"] == "access"


def test_refresh_token_creation_and_validation():
    """Test creating and validating refresh tokens."""
    payload = {"sub": "user-456"}
    token = create_refresh_token(payload)
    
    # Token should be a non-empty string
    assert isinstance(token, str)
    assert len(token) > 0
    
    # Should decode successfully
    decoded = decode_refresh_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-456"
    assert decoded["type"] == "refresh"


def test_invalid_token_decoding():
    """Test that invalid tokens are rejected."""
    invalid_token = "this-is-not-a-valid-jwt-token"
    
    assert decode_access_token(invalid_token) is None
    assert decode_refresh_token(invalid_token) is None


def test_token_type_mismatch():
    """Test that access tokens are not accepted as refresh tokens and vice versa."""
    access_token = create_access_token({"sub": "user-123"})
    refresh_token = create_refresh_token({"sub": "user-123"})
    
    # Access token should not validate as refresh token
    assert decode_refresh_token(access_token) is None
    
    # Refresh token should not validate as access token
    assert decode_access_token(refresh_token) is None


def test_token_hashing():
    """Test token hashing for storage."""
    token = "sample-refresh-token"
    hashed = hash_token(token)
    
    # Hash should be different from original
    assert hashed != token
    
    # Hash should be consistent
    assert hash_token(token) == hashed
    
    # Different tokens should produce different hashes
    assert hash_token("different-token") != hashed
