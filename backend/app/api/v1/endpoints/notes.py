"""API endpoints for clinical notes management."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.note import (
    NoteCreate,
    NoteUpdate,
    NoteResponse,
   NoteListItem,
    NoteVersionResponse,
    GenerateSplitsRequest
)
from app.services.note_service import NoteService

router = APIRouter()


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    note_data: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new clinical note with initial version."""
    note = NoteService.create_note(db, note_data, current_user.id)
    return note


@router.get("/", response_model=List[NoteListItem])
def list_notes(
    patient_id: UUID = Query(..., description="Patient ID to filter notes"),
    kind: Optional[str] = Query(None, description="Filter by note kind"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List notes for a patient with optional kind filter.
    
    - **patient_id**: Required patient ID
    - **kind**: Optional filter (conceptualization, followup, split)
    """
    notes = NoteService.get_notes_by_patient(db, patient_id, current_user.id, kind)
    
    # Add version_count to each note
    result = []
    for note in notes:
        result.append({
            "id": note.id,
            "title": note.title,
            "kind": note.kind,
            "patient_id": note.patient_id,
            "author_id": note.author_id,
            "created_at": note.created_at,
            "updated_at": note.updated_at,
            "version_count": len(note.versions)
        })
    
    return result


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single note by ID."""
    note = NoteService.get_note_by_id(db, note_id, current_user.id)
    return note


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: UUID,
    note_data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a note (creates new version)."""
    note = NoteService.update_note(db, note_id, note_data, current_user.id)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a note."""
    NoteService.delete_note(db, note_id, current_user.id)
    return None


@router.get("/{note_id}/versions", response_model=List[NoteVersionResponse])
def get_note_versions(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all versions for a note."""
    versions = NoteService.get_note_versions(db, note_id, current_user.id)
    return versions


@router.post("/{note_id}/restore/{version_number}", response_model=NoteResponse)
def restore_note_version(
    note_id: UUID,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Restore a note to a previous version (creates new version with old content)."""
    note = NoteService.restore_note_version(db, note_id, version_number, current_user.id)
    return note


@router.get("/{note_id}/splits", response_model=List[NoteResponse])
def get_split_notes(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all split notes for a conceptualization note."""
    splits = NoteService.get_split_notes(db, note_id, current_user.id)
    return splits


@router.post("/{note_id}/generate-splits")
async def generate_split_files(
    note_id: UUID,
    request: GenerateSplitsRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate split files from a conceptualization note.
    
    - **categories**: Optional list of category names in the request body
      - If None: LLM will infer categories from content
      - If provided: Use these specific categories
    
    Runs in background and returns immediately.
    """
    from app.services.tasks.factory import get_task_processor
    
    # Verify note exists and is conceptualization
    note = NoteService.get_note_by_id(db, note_id, current_user.id)
    
    if note.kind != "conceptualization":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only generate splits from conceptualization notes"
        )
    
    # Check if splits already exist
    existing_splits = NoteService.count_split_notes(db, note_id)
    
    if existing_splits > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Split files already exist for this note ({existing_splits} splits). Delete them first to regenerate."
        )
    
    # Queue background task
    processor = get_task_processor()
    
    async def generate_task():
        try:
            await processor.process_split_generation(
                conceptualization_id=note_id,
                categories=request.categories,
                user_id=current_user.id
            )
        except Exception as e:
            print(f"Error generating splits: {str(e)}")
    
    background_tasks.add_task(generate_task)
    
    return {
        "message": "Split generation started",
        "status": "processing",
        "categories": request.categories
    }


@router.get("/categories/defaults")
def get_default_categories():
    """Get platform default split file categories."""
    return {
        "categories": [
            "Background",
            "Presenting Problem",
            "Symptoms",
            "Mental Status",
            "Treatment Plan",
            "Risk Assessment"
        ]
    }
