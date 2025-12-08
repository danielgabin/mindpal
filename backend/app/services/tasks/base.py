"""Base task processor interface using Strategy Pattern."""

from abc import ABC, abstractmethod
from enum import Enum
from typing import List, Optional
from uuid import UUID


class TaskStatus(str, Enum):
    """Status of async tasks."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskProcessor(ABC):
    """
    Abstract base class for task processors.
    
    Allows swapping between sync, background, and celery implementations.
    """
    
    @abstractmethod
    async def process_split_generation(
        self,
        conceptualization_id: UUID,
        categories: Optional[List[str]],
        user_id: UUID
    ) -> List[UUID]:
        """
        Generate split files from conceptualization note.
        
        Args:
            conceptualization_id: ID of the conceptualization note
            categories: Optional list of category names (None = LLM infers)
            user_id: ID of the user requesting generation
        
        Returns:
            List of created note IDs
        """
        pass
