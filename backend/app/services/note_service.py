"""
Note service handling clinical note CRUD operations and versioning.
Business logic layer between API endpoints and database models.
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from uuid import UUID
from app.models.note import Note, NoteKind
from app.models.note_version import NoteVersion
from app.models.patient import Patient
from app.schemas.note import NoteCreate, NoteUpdate


class NoteService:
    """Service class for clinical note operations."""
    
    @staticmethod
    def _verify_patient_ownership(db: Session, patient_id: UUID, user_id: UUID) -> Patient:
        """Verify user owns the patient."""
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
    def _create_version(db: Session, note: Note, editor_id: UUID) -> NoteVersion:
        """Create a new version for a note."""
        # Get current version count
        version_count = db.query(NoteVersion).filter(
            NoteVersion.note_id == note.id
        ).count()
        
        # Create new version
        version = NoteVersion(
            note_id=note.id,
            editor_id=editor_id,
            content_markdown=note.content_markdown,
            version_number=version_count + 1
        )
        
        db.add(version)
        return version
    
    @staticmethod
    def create_note(db: Session, note_data: NoteCreate, user_id: UUID) -> Note:
        """
        Create a new clinical note.
        
        - Verifies patient ownership
        - If conceptualization, checks patient doesn't have one already
        - If split, verifies parent exists and is conceptualization
        - Creates initial version (v1)
        """
        # Verify patient ownership
        NoteService._verify_patient_ownership(db, note_data.patient_id, user_id)
        
        # If conceptualization, check for existing one
        if note_data.kind == NoteKind.CONCEPTUALIZATION.value:
            existing = db.query(Note).filter(
                and_(
                    Note.patient_id == note_data.patient_id,
                    Note.kind == NoteKind.CONCEPTUALIZATION.value
                )
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Patient already has a conceptualization note"
                )
        
        # If split, verify parent exists and is conceptualization
        if note_data.kind == NoteKind.SPLIT.value:
            if not note_data.parent_note_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="parent_note_id is required for split notes"
                )
            
            parent = db.query(Note).filter(Note.id == note_data.parent_note_id).first()
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent note not found"
                )
            
            if parent.kind != NoteKind.CONCEPTUALIZATION.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent note must be a conceptualization note"
                )
        
        # Create note
        note = Note(
            patient_id=note_data.patient_id,
            author_id=user_id,
            parent_note_id=note_data.parent_note_id,
            kind=note_data.kind,
            title=note_data.title,
            content_markdown=note_data.content_markdown
        )
        
        db.add(note)
        db.flush()  # Get note.id
        
        # Create initial version
        NoteService._create_version(db, note, user_id)
        
        db.commit()
        db.refresh(note)
        
        return note
    
    @staticmethod
    def get_notes_by_patient(
        db: Session,
        patient_id: UUID,
        user_id: UUID,
        kind_filter: Optional[str] = None
    ) -> List[Note]:
        """
        Get all notes for a patient with optional kind filter.
        """
        # Verify patient ownership
        NoteService._verify_patient_ownership(db, patient_id, user_id)
        
        query = db.query(Note).filter(Note.patient_id == patient_id)
        
        if kind_filter:
            query = query.filter(Note.kind == kind_filter)
        
        return query.order_by(Note.created_at.desc()).all()
    
    @staticmethod
    def get_note_by_id(db: Session, note_id: UUID, user_id: UUID) -> Note:
        """
        Get a single note by ID with ownership verification.
        """
        note = db.query(Note).filter(Note.id == note_id).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        # Verify ownership through patient
        NoteService._verify_patient_ownership(db, note.patient_id, user_id)
        
        return note
    
    @staticmethod
    def update_note(
        db: Session,
        note_id: UUID,
        note_data: NoteUpdate,
        user_id: UUID
    ) -> Note:
        """
        Update a note and create a new version.
        """
        # Get note and verify ownership
        note = NoteService.get_note_by_id(db, note_id, user_id)
        
        # Update fields
        if note_data.title is not None:
            note.title = note_data.title
        if note_data.content_markdown is not None:
            note.content_markdown = note_data.content_markdown
        
        # Create new version with updated content
        NoteService._create_version(db, note, user_id)
        
        db.commit()
        db.refresh(note)
        
        return note
    
    @staticmethod
    def delete_note(db: Session, note_id: UUID, user_id: UUID) -> None:
        """
        Delete a note.
        If conceptualization with split notes, prevent deletion.
        """
        # Get note and verify ownership
        note = NoteService.get_note_by_id(db, note_id, user_id)
        
        # If conceptualization, check for dependent split notes
        if note.kind == NoteKind.CONCEPTUALIZATION.value:
            split_count = db.query(Note).filter(
                Note.parent_note_id == note_id
            ).count()
            
            if split_count > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot delete conceptualization note with {split_count} split notes"
                )
        
        db.delete(note)
        db.commit()
    
    @staticmethod
    def get_note_versions(db: Session, note_id: UUID, user_id: UUID) -> List[NoteVersion]:
        """
        Get all versions for a note.
        """
        # Verify ownership
        NoteService.get_note_by_id(db, note_id, user_id)
        
        versions = db.query(NoteVersion).filter(
            NoteVersion.note_id == note_id
        ).order_by(NoteVersion.version_number.desc()).all()
        
        return versions
    
    @staticmethod
    def restore_note_version(
        db: Session,
        note_id: UUID,
        version_number: int,
        user_id: UUID
    ) -> Note:
        """
        Restore a note to a previous version.
        Creates a new version with the old content.
        """
        # Get note and verify ownership
        note = NoteService.get_note_by_id(db, note_id, user_id)
        
        # Get specified version
        version = db.query(NoteVersion).filter(
            and_(
                NoteVersion.note_id == note_id,
                NoteVersion.version_number == version_number
            )
        ).first()
        
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Version {version_number} not found"
            )
        
        # Update note content to old version
        note.content_markdown = version.content_markdown
        
        # Create new version with restored content
        NoteService._create_version(db, note, user_id)
        
        db.commit()
        db.refresh(note)
        
        return note
    
    @staticmethod
    def get_split_notes(db: Session, parent_note_id: UUID, user_id: UUID) -> List[Note]:
        """
        Get all split notes for a conceptualization.
        """
        # Verify ownership of parent
        parent = NoteService.get_note_by_id(db, parent_note_id, user_id)
        
        if parent.kind != NoteKind.CONCEPTUALIZATION.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Note is not a conceptualization"
            )
        
        splits = db.query(Note).filter(
            Note.parent_note_id == parent_note_id
        ).order_by(Note.created_at.asc()).all()
        
        return splits
