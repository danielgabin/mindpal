"""
Patient service handling patient CRUD operations and entity management.
Business logic layer between API endpoints and database models.
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from uuid import UUID
from app.models.patient import Patient
from app.models.patient_entity import PatientEntity
from app.schemas.patient import PatientCreate, PatientUpdate, PatientEntityCreate


class PatientService:
    """Service class for patient operations."""
    
    @staticmethod
    def create_patient(db: Session, patient_data: PatientCreate, user_id: UUID) -> Patient:
        """
        Create a new patient.
        
        Args:
            db: Database session
            patient_data: Patient creation data
            user_id: ID of the psychologist creating the patient
            
        Returns:
            Created patient instance
        """
        # Create new patient (validation already done in schema)
        patient = Patient(
            first_name=patient_data.first_name,
            last_name=patient_data.last_name,
            date_of_birth=patient_data.date_of_birth,
            email=patient_data.email,
            phone=patient_data.phone,
            appointment_reason=patient_data.appointment_reason,
            tutor_name=patient_data.tutor_name,
            tutor_phone=patient_data.tutor_phone,
            tutor_email=patient_data.tutor_email,
            tutor_relationship=patient_data.tutor_relationship,
            created_by=user_id
        )
        
        db.add(patient)
        db.commit()
        db.refresh(patient)
        
        return patient
    
    @staticmethod
    def get_patients(
        db: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[Patient]:
        """
        Get list of patients for a psychologist with optional filters.
        
        Args:
            db: Database session
            user_id: ID of the psychologist
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            search: Search query for name/email
            is_active: Filter by active status
            
        Returns:
            List of patients
        """
        query = db.query(Patient).filter(Patient.created_by == user_id)
        
        # Apply is_active filter if specified
        if is_active is not None:
            query = query.filter(Patient.is_active == is_active)
        
        # Apply search filter if specified
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Patient.first_name.ilike(search_pattern),
                    Patient.last_name.ilike(search_pattern),
                    Patient.email.ilike(search_pattern)
                )
            )
        
        # Order by created_at descending (newest first)
        query = query.order_by(Patient.created_at.desc())
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_patient_by_id(db: Session, patient_id: UUID, user_id: UUID) -> Patient:
        """
        Get a single patient by ID, verifying ownership.
        
        Args:
            db: Database session
            patient_id: Patient ID
            user_id: ID of the psychologist (for ownership check)
            
        Returns:
            Patient instance
            
        Raises:
            HTTPException: If patient not found or not owned by user
        """
        patient = db.query(Patient).filter(
            Patient.id == patient_id,
            Patient.created_by == user_id
        ).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        return patient
    
    @staticmethod
    def update_patient(
        db: Session,
        patient_id: UUID,
        patient_data: PatientUpdate,
        user_id: UUID
    ) -> Patient:
        """
        Update a patient.
        
        Args:
            db: Database session
            patient_id: Patient ID
            patient_data: Updated patient data
            user_id: ID of the psychologist (for ownership check)
            
        Returns:
            Updated patient instance
            
        Raises:
            HTTPException: If patient not found or not owned by user
        """
        # Get patient and verify ownership
        patient = PatientService.get_patient_by_id(db, patient_id, user_id)
        
        # Update only provided fields
        update_data = patient_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(patient, field, value)
        
        db.commit()
        db.refresh(patient)
        
        return patient
    
    @staticmethod
    def delete_patient(db: Session, patient_id: UUID, user_id: UUID) -> None:
        """
        Soft delete a patient (set is_active to False).
        
        Args:
            db: Database session
            patient_id: Patient ID
            user_id: ID of the psychologist (for ownership check)
            
        Raises:
            HTTPException: If patient not found or not owned by user
        """
        # Get patient and verify ownership
        patient = PatientService.get_patient_by_id(db, patient_id, user_id)
        
        # Soft delete
        patient.is_active = False
        db.commit()
    
    @staticmethod
    def get_patient_entities(
        db: Session,
        patient_id: UUID,
        user_id: UUID
    ) -> List[PatientEntity]:
        """
        Get all entities for a patient.
        
        Args:
            db: Database session
            patient_id: Patient ID
            user_id: ID of the psychologist (for ownership check)
            
        Returns:
            List of patient entities
            
        Raises:
            HTTPException: If patient not found or not owned by user
        """
        # Verify patient ownership
        PatientService.get_patient_by_id(db, patient_id, user_id)
        
        # Get entities
        entities = db.query(PatientEntity).filter(
            PatientEntity.patient_id == patient_id
        ).order_by(PatientEntity.created_at.desc()).all()
        
        return entities
    
    @staticmethod
    def add_patient_entity(
        db: Session,
        patient_id: UUID,
        entity_data: PatientEntityCreate,
        user_id: UUID
    ) -> PatientEntity:
        """
        Add a new entity to a patient.
        
        Args:
            db: Database session
            patient_id: Patient ID
            entity_data: Entity data (type and value)
            user_id: ID of the psychologist (for ownership check)
            
        Returns:
            Created patient entity
            
        Raises:
            HTTPException: If patient not found or not owned by user
        """
        # Verify patient ownership
        PatientService.get_patient_by_id(db, patient_id, user_id)
        
        # Create entity
        entity = PatientEntity(
            patient_id=patient_id,
            type=entity_data.type,
            value=entity_data.value,
            created_by=user_id
        )
        
        db.add(entity)
        db.commit()
        db.refresh(entity)
        
        return entity
    
    @staticmethod
    def delete_patient_entity(
        db: Session,
        entity_id: UUID,
        patient_id: UUID,
        user_id: UUID
    ) -> None:
        """
        Delete a patient entity.
        
        Args:
            db: Database session
            entity_id: Entity ID
            patient_id: Patient ID (for ownership verification)
            user_id: ID of the psychologist (for ownership check)
            
        Raises:
            HTTPException: If entity not found or patient not owned by user
        """
        # Verify patient ownership
        PatientService.get_patient_by_id(db, patient_id, user_id)
        
        # Get and delete entity
        entity = db.query(PatientEntity).filter(
            PatientEntity.id == entity_id,
            PatientEntity.patient_id == patient_id
        ).first()
        
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        db.delete(entity)
        db.commit()
