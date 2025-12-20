import logging
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.models.template import Template
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

def seed_users(db: Session) -> None:
    # 1. Ensure Dr. Smith exists
    user_email = "dr.smith@mindpal.com"
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        user = User(
            email=user_email,
            hashed_password=get_password_hash("password"), # Default password
            first_name="Dr.",
            last_name="Smith",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created user: {user_email}")
    else:
        logger.info(f"User already exists: {user_email}")

    # 2. Create a custom template for Dr. Smith
    template_name = "Dr. Smith's Custom Assessment"
    template = db.query(Template).filter(
        Template.owner_id == user.id, 
        Template.name == template_name
    ).first()

    if not template:
        template = Template(
            name=template_name,
            content_markdown="""# Dr. Smith's Custom Assessment

## Chief Complaint
*Patient's primary reason for visit.*

## History
*Detailed history here...*

## Assessment
*Clinical impression.*

## Plan
1. 
2. 
3. 
""",
            is_default=False,
            owner_id=user.id
        )
        db.add(template)
        db.commit()
        logger.info(f"Created template: {template_name}")
    else:
        logger.info(f"Template already exists: {template_name}")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        logging.basicConfig(level=logging.INFO)
        seed_users(db)
    finally:
        db.close()
