"""Add notes and note_versions tables.

Revision ID: 003_add_notes
Revises: 002_add_patients
Create Date: 2025-12-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '003_add_notes'
down_revision = '002_add_patients'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create note_kind enum (check if exists first)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE note_kind AS ENUM ('conceptualization', 'followup', 'split');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create notes table
    op.create_table(
        'notes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('author_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('parent_note_id', postgresql.UUID(as_uuid=True), nullable=True),  # For split notes
        sa.Column('kind', sa.String(), nullable=False),  # Will be constrained by enum
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('content_markdown', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], name='fk_notes_patient_id'),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], name='fk_notes_author_id'),
        sa.ForeignKeyConstraint(['parent_note_id'], ['notes.id'], name='fk_notes_parent_note_id'),
    )
    
    # Add type constraint for kind column
    op.execute("ALTER TABLE notes ALTER COLUMN kind TYPE note_kind USING kind::note_kind")
    
    op.create_index('ix_notes_id', 'notes', ['id'])
    op.create_index('ix_notes_patient_id', 'notes', ['patient_id'])
    op.create_index('ix_notes_author_id', 'notes', ['author_id'])
    op.create_index('ix_notes_parent_note_id', 'notes', ['parent_note_id'])
    op.create_index('ix_notes_kind', 'notes', ['kind'])
    
    # Create note_versions table
    op.create_table(
        'note_versions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('note_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('editor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content_markdown', sa.Text(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], name='fk_note_versions_note_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['editor_id'], ['users.id'], name='fk_note_versions_editor_id'),
    )
    
    op.create_index('ix_note_versions_id', 'note_versions', ['id'])
    op.create_index('ix_note_versions_note_id', 'note_versions', ['note_id'])
    op.create_index('ix_note_versions_note_id_version', 'note_versions', ['note_id', 'version_number'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_note_versions_note_id_version', 'note_versions')
    op.drop_index('ix_note_versions_note_id', 'note_versions')
    op.drop_index('ix_note_versions_id', 'note_versions')
    op.drop_table('note_versions')
    
    op.drop_index('ix_notes_kind', 'notes')
    op.drop_index('ix_notes_parent_note_id', 'notes')
    op.drop_index('ix_notes_author_id', 'notes')
    op.drop_index('ix_notes_patient_id', 'notes')
    op.drop_index('ix_notes_id', 'notes')
    op.drop_table('notes')
    
    op.execute('DROP TYPE note_kind')
