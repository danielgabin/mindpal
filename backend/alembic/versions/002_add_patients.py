"""Add patients and patient_entities tables.

Revision ID: 002_add_patients
Revises: 001_initial_schema
Create Date: 2025-12-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '002_add_patients'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create entity_type enum (check if exists first)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE entity_type AS ENUM ('symptom', 'medication', 'feeling');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create patients table
    op.create_table(
        'patients',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('appointment_reason', sa.Text(), nullable=True),
        sa.Column('tutor_name', sa.String(), nullable=True),
        sa.Column('tutor_phone', sa.String(), nullable=True),
        sa.Column('tutor_email', sa.String(), nullable=True),
        sa.Column('tutor_relationship', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_patients_created_by'),
    )
    op.create_index('ix_patients_id', 'patients', ['id'])
    op.create_index('ix_patients_email', 'patients', ['email'])
    op.create_index('ix_patients_is_active', 'patients', ['is_active'])
    op.create_index('ix_patients_created_by', 'patients', ['created_by'])
    
    # Create patient_entities table
    # Note: We create the enum separately above, so we use sa.String here and cast in SQL
    op.create_table(
        'patient_entities',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(), nullable=False),  # Will be constrained by enum
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], name='fk_patient_entities_patient_id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_patient_entities_created_by'),
    )
    
    # Add type constraint for type column
    op.execute("ALTER TABLE patient_entities ALTER COLUMN type TYPE entity_type USING type::entity_type")
    
    op.create_index('ix_patient_entities_id', 'patient_entities', ['id'])
    op.create_index('ix_patient_entities_patient_id', 'patient_entities', ['patient_id'])
    op.create_index('ix_patient_entities_type', 'patient_entities', ['type'])


def downgrade() -> None:
    op.drop_index('ix_patient_entities_type', 'patient_entities')
    op.drop_index('ix_patient_entities_patient_id', 'patient_entities')
    op.drop_index('ix_patient_entities_id', 'patient_entities')
    op.drop_table('patient_entities')
    
    op.drop_index('ix_patients_created_by', 'patients')
    op.drop_index('ix_patients_is_active', 'patients')
    op.drop_index('ix_patients_email', 'patients')
    op.drop_index('ix_patients_id', 'patients')
    op.drop_table('patients')
    
    op.execute('DROP TYPE entity_type')
