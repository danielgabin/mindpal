"""Service for managing templates."""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateUpdate


class TemplateService:
    """Service for template CRUD operations."""

    def get_by_id(self, db: Session, id: UUID) -> Optional[Template]:
        return db.query(Template).filter(Template.id == id).first()

    def get_multi(
        self, 
        db: Session, 
        owner_id: Optional[UUID] = None, 
        include_defaults: bool = True,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Template]:
        """
        Get templates.
        If owner_id is provided, returns user's templates AND default templates (if include_defaults=True).
        If owner_id is None, returns only default templates (if include_defaults=True).
        """
        filters = []
        
        if owner_id and include_defaults:
            # User's templates OR system defaults
            filters.append(or_(Template.owner_id == owner_id, Template.is_default == True))
        elif owner_id:
            # Only user's templates
            filters.append(Template.owner_id == owner_id)
        elif include_defaults:
            # Only system defaults
            filters.append(Template.is_default == True)
        else:
            # Returns nothing if no owner and no defaults requested (edge case)
            return []
            
        return db.query(Template).filter(and_(*filters)).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: TemplateCreate, owner_id: Optional[UUID] = None) -> Template:
        db_obj = Template(
            name=obj_in.name,
            content_markdown=obj_in.content_markdown,
            is_default=obj_in.is_default,
            owner_id=owner_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Template, obj_in: TemplateUpdate) -> Template:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, db_obj: Template) -> Template:
        db.delete(db_obj)
        db.commit()
        return db_obj


template_service = TemplateService()
