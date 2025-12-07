"""Integration tests for user management endpoints."""

import pytest
from fastapi import status


def get_auth_headers(client):
    """Helper to get authentication headers."""
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "testuser@example.com",
            "full_name": "Test User",
            "password": "password123",
            "role": "psychologist"
        }
    )
    
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "testuser@example.com",
            "password": "password123"
        }
    )
    tokens = response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_update_user_profile(client):
    """Test updating user profile."""
    headers = get_auth_headers(client)
    
    response = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={
            "full_name": "Updated Name"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["full_name"] == "Updated Name"


def test_change_password(client):
    """Test password change."""
    headers = get_auth_headers(client)
    
    response = client.patch(
        "/api/v1/users/me/password",
        headers=headers,
        json={
            "current_password": "password123",
            "new_password": "newpassword456"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    # Verify new password works
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "testuser@example.com",
            "password": "newpassword456"
        }
    )
    assert login_response.status_code == status.HTTP_200_OK


def test_change_password_wrong_current(client):
    """Test password change with wrong current password."""
    headers = get_auth_headers(client)
    
    response = client.patch(
        "/api/v1/users/me/password",
        headers=headers,
        json={
            "current_password": "wrongpassword",
            "new_password": "newpassword456"
        }
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
