"""API v1 router combining all endpoint routers."""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, patients, notes

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
