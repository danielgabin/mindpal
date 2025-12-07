"""Integration tests for authentication API endpoints."""

import pytest
from fastapi import status


def test_register_user(client):
    """Test user registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "SecurePassword123!",
            "role": "psychologist"
        }
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "psychologist"
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data


def test_register_duplicate_email(client, test_user):
    """Test that duplicate email registration is rejected."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email,
            "full_name": "Another User",
            "password": "password123",
            "role": "psychologist"
        }
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already registered" in response.json()["detail"].lower()


def test_login_success(client, test_user):
    """Test successful login."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    """Test login with incorrect password."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrongpassword"
        }
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_login_nonexistent_user(client):
    """Test login with non-existent user."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "password123"
        }
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_refresh_token(client, test_user):
    """Test token refresh."""
    # First login to get tokens
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    tokens = login_response.json()
    
    # Use refresh token to get new access token
    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]}
    )
    
    assert refresh_response.status_code == status.HTTP_200_OK
    new_data = refresh_response.json()
    assert "access_token" in new_data
    assert new_data["token_type"] == "bearer"


def test_logout(client, test_user):
    """Test logout (refresh token revocation)."""
    # Login first
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    tokens = login_response.json()
    
    # Logout
    logout_response = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": tokens["refresh_token"]}
    )
    
    assert logout_response.status_code == status.HTTP_200_OK
    
    # Try to use revoked refresh token
    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]}
    )
    
    assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_current_user(client, test_user):
    """Test getting current user profile."""
    # Login first
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "testpassword123"
        }
    )
    tokens = login_response.json()
    
    # Get user profile
    profile_response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    
    assert profile_response.status_code == status.HTTP_200_OK
    data = profile_response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"


def test_protected_endpoint_without_token(client):
    """Test that protected endpoints require authentication."""
    response = client.get("/api/v1/users/me")
    assert response.status_code == status.HTTP_403_FORBIDDEN
