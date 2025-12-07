"""
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router
from app.schemas.common import HealthCheckResponse
from app import __version__

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=__version__,
    description="Clinical notes management system for psychologists with AI features",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", response_model=HealthCheckResponse, tags=["health"])
def health_check():
    """Health check endpoint for Docker and monitoring."""
    return HealthCheckResponse(status="healthy", version=__version__)


@app.get("/", tags=["root"])
def root():
    """Root endpoint with API information."""
    return {
        "message": "MindPal Clinical Notes API",
        "version": __version__,
        "docs": "/docs"
    }
