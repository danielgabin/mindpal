"""Background task processor using FastAPI BackgroundTasks."""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.services.tasks.base import TaskProcessor
from app.services.llm.gemini_client import gemini_client
from app.models.note import Note
from app.models.note_version import NoteVersion
from app.core.config import settings


class BackgroundTaskProcessor(TaskProcessor):
    """Process tasks in background using FastAPI BackgroundTasks."""
    
    async def process_split_generation(
        self,
        conceptualization_id: UUID,
        categories: Optional[List[str]],
        user_id: UUID
    ) -> List[UUID]:
        """
        Generate split files from conceptualization.
        
        This runs in a background task, so errors should be handled gracefully.
        """
        from app.db.session import SessionLocal
        
        db = SessionLocal()
        created_note_ids = []
        
        try:
            # 1. Fetch conceptualization note
            conceptualization = db.query(Note).filter(
                Note.id == conceptualization_id
            ).first()
            
            if not conceptualization:
                raise ValueError(f"Conceptualization note {conceptualization_id} not found")
            
            # 2. Call Gemini to generate splits
            splits = await gemini_client.generate_split_files(
                conceptualization_content=conceptualization.content_markdown,
                categories=categories,
                max_splits=settings.MAX_SPLIT_FILES
            )
            
            # 3. Create Note records for each split
            for split in splits:
                # Create split note
                split_note = Note(
                    patient_id=conceptualization.patient_id,
                    author_id=user_id,
                    parent_note_id=conceptualization_id,
                    kind="split",
                    title=split['title'],
                    content_markdown=split['content']
                )
                
                db.add(split_note)
                db.flush()  # Get ID
                
                # Create initial version
                version = NoteVersion(
                    note_id=split_note.id,
                    editor_id=user_id,
                    content_markdown=split['content'],
                    version_number=1
                )
                
                db.add(version)
                created_note_ids.append(split_note.id)
            
            db.commit()
            
            return created_note_ids
            
        except Exception as e:
            db.rollback()
            # Log error (in production, use proper logging)
            print(f"Error in split generation: {str(e)}")
            raise
            
        finally:
            db.close()


class SyncTaskProcessor(TaskProcessor):
    """Synchronous task processor (for testing or simple deployments)."""
    
    async def process_split_generation(
        self,
        conceptualization_id: UUID,
        categories: Optional[List[str]],
        user_id: UUID
    ) -> List[UUID]:
        """Process synchronously (blocks until complete)."""
        # For now, just use the same logic as background
        processor = BackgroundTaskProcessor()
        return await processor.process_split_generation(
            conceptualization_id,
            categories,
            user_id
        )
