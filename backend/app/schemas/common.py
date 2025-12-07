"""Common response schemas."""

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
