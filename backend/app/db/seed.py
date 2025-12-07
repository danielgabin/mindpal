"""
Seed script to populate database with test data.
Run with: python -m app.db.seed
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.clinic import Clinic
from app.core.security import hash_password


def seed_database():
    """Seed the database with test data."""
    db = SessionLocal()
    
    try:
        # Create a test clinic
        clinic = Clinic(
            name="Psychology Wellness Center",
            email="contact@psychwell.com",
            address="123 Mental Health St, Wellness City, WC 12345"
        )
        db.add(clinic)
        db.commit()
        db.refresh(clinic)
        print(f"✓ Created clinic: {clinic.name}")
        
        # Create admin user
        admin = User(
            email="admin@mindpal.com",
            full_name="Admin User",
            password_hash=hash_password("admin123"),
            role=UserRole.ADMIN.value,  # Use .value to get the lowercase string
            clinic_id=clinic.id
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"✓ Created admin user: {admin.email} (password: admin123)")
        
        # Set clinic contact
        clinic.contact_id = admin.id
        db.commit()
        
        # Create psychologist users
        psychologists = [
            {
                "email": "dr.smith@mindpal.com",
                "full_name": "Dr. Sarah Smith",
                "password": "psychologist123",
                "clinic_id": clinic.id
            },
            {
                "email": "dr.johnson@mindpal.com",
                "full_name": "Dr. Michael Johnson",
                "password": "psychologist123",
                "clinic_id": clinic.id
            },
            {
                "email": "dr.williams@mindpal.com",
                "full_name": "Dr. Emily Williams",
                "password": "psychologist123",
                "clinic_id": None  # Independent psychologist
            }
        ]
        
        for psych_data in psychologists:
            psychologist = User(
                email=psych_data["email"],
                full_name=psych_data["full_name"],
                password_hash=hash_password(psych_data["password"]),
                role=UserRole.PSYCHOLOGIST.value,  # Use .value to get the lowercase string
                clinic_id=psych_data["clinic_id"]
            )
            db.add(psychologist)
            db.commit()
            db.refresh(psychologist)
            print(f"✓ Created psychologist: {psychologist.email} (password: psychologist123)")
        
        print("\n✅ Database seeded successfully!")
        print("\nTest Accounts:")
        print("=" * 60)
        print("Admin:")
        print("  Email: admin@mindpal.com")
        print("  Password: admin123")
        print("\nPsychologists:")
        print("  Email: dr.smith@mindpal.com | Password: psychologist123")
        print("  Email: dr.johnson@mindpal.com | Password: psychologist123")
        print("  Email: dr.williams@mindpal.com | Password: psychologist123")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding database with test data...")
    seed_database()
