"""API endpoints for patient management."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListItem,
    PatientEntityCreate,
    PatientEntityResponse
)
from app.services.patient_service import PatientService

router = APIRouter()


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new patient."""
    patient = PatientService.create_patient(db, patient_data, current_user.id)
    return patient


@router.get("/", response_model=List[PatientListItem])
def list_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List patients with optional search and filters.
    
    - **search**: Search in first_name, last_name, email
    - **is_active**: Filter by active status (true/false)
    - **skip**: Number of records to skip (default: 0)
    - **limit**: Max records to return (default: 100, max: 200)
    """
    patients = PatientService.get_patients(
        db,
        current_user.id,
        skip=skip,
        limit=limit,
        search=search,
        is_active=is_active
    )
    return patients


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single patient by ID."""
    patient = PatientService.get_patient_by_id(db, patient_id, current_user.id)
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: UUID,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a patient."""
    patient = PatientService.update_patient(db, patient_id, patient_data, current_user.id)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete a patient (archive)."""
    PatientService.delete_patient(db, patient_id, current_user.id)
    return None


@router.get("/{patient_id}/entities", response_model=List[PatientEntityResponse])
def get_patient_entities(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all entities (symptoms, medications, feelings) for a patient."""
    entities = PatientService.get_patient_entities(db, patient_id, current_user.id)
    return entities


@router.post("/{patient_id}/entities", response_model=PatientEntityResponse, status_code=status.HTTP_201_CREATED)
def add_patient_entity(
    patient_id: UUID,
    entity_data: PatientEntityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a new entity (symptom, medication, or feeling) to a patient."""
    entity = PatientService.add_patient_entity(db, patient_id, entity_data, current_user.id)
    return entity


@router.delete("/{patient_id}/entities/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient_entity(
    patient_id: UUID,
    entity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a patient entity."""
    PatientService.delete_patient_entity(db, entity_id, patient_id, current_user.id)
    return None
