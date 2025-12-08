"""Factory for creating task processors based on configuration."""

from app.services.tasks.base import TaskProcessor
from app.services.tasks.processors import BackgroundTaskProcessor, SyncTaskProcessor
from app.core.config import settings


def get_task_processor() -> TaskProcessor:
    """
    Get the configured task processor.
    
    Returns the appropriate processor based on TASK_PROCESSOR setting.
    """
    processor_type = settings.TASK_PROCESSOR.lower()
    
    if processor_type == "background":
        return BackgroundTaskProcessor()
    elif processor_type == "sync":
        return SyncTaskProcessor()
    # elif processor_type == "celery":  # For future implementation
    #     return CeleryTaskProcessor()
    else:
        # Default to background
        return BackgroundTaskProcessor()
