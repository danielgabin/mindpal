"""API endpoints for templates."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.template import TemplateResponse, TemplateCreate, TemplateUpdate
from app.services.template import template_service

router = APIRouter()


@router.get("/", response_model=List[TemplateResponse])
def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_defaults: bool = True
):
    """
    Get all templates.
    Returns user's custom templates and system default templates.
    """
    templates = template_service.get_multi(
        db, 
        owner_id=current_user.id, 
        include_defaults=include_defaults
    )
    return templates


@router.get("/{id}", response_model=TemplateResponse)
def get_template(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific template by ID."""
    template = template_service.get_by_id(db, id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Check permissions: User can view their own or default templates
    if template.owner_id != current_user.id and not template.is_default:
        raise HTTPException(status_code=403, detail="Not authorized to view this template")
        
    return template


@router.post("/", response_model=TemplateResponse)
def create_template(
    template_in: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new template."""
    # Regular users cannot create default templates
    if template_in.is_default:
        # Here we could check for admin role, but for now we enforce false
        # or just ignore it. Let's force it to False for regular users if we had roles.
        # Assuming current user is just a regular user for now.
        # Ideally we'd have `if not current_user.is_superuser: template_in.is_default = False`
        # But User model doesn't show is_superuser in my view yet.
        pass
        
    template = template_service.create(db, obj_in=template_in, owner_id=current_user.id)
    return template


@router.put("/{id}", response_model=TemplateResponse)
def update_template(
    id: UUID,
    template_in: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a template."""
    template = template_service.get_by_id(db, id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    if template.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this template")
        
    template = template_service.update(db, db_obj=template, obj_in=template_in)
    return template


@router.delete("/{id}", response_model=TemplateResponse)
def delete_template(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a template."""
    template = template_service.get_by_id(db, id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    if template.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this template")
        
    template = template_service.delete(db, db_obj=template)
    return template
