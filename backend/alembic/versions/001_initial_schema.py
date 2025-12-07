"""Initial database schema for users, clinics, and refresh tokens."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user role enum (check if exists first)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE userrole AS ENUM ('psychologist', 'admin');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create clinics table first (no foreign keys yet)
    op.create_table(
        'clinics',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('address', sa.String(), nullable=True),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.UniqueConstraint('email', name='uq_clinics_email')
    )
    op.create_index('ix_clinics_id', 'clinics', ['id'])
    
    # Create users table
    # Note: We create the enum separately above, so we use sa.String here and cast in SQL
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),  # Will be constrained by enum
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('clinic_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], name='fk_users_clinic_id'),
        sa.UniqueConstraint('email', name='uq_users_email')
    )
    
    # Add type constraint for role column
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'])
    
    # Add foreign key from clinics to users for contact_id
    op.create_foreign_key('fk_clinics_contact_id', 'clinics', 'users', ['contact_id'], ['id'])
    
    # Create refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('token_hash', sa.String(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_refresh_tokens_user_id'),
        sa.UniqueConstraint('token_hash', name='uq_refresh_tokens_token_hash')
    )
    op.create_index('ix_refresh_tokens_id', 'refresh_tokens', ['id'])
    op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'])


def downgrade() -> None:
    op.drop_index('ix_refresh_tokens_token_hash', 'refresh_tokens')
    op.drop_index('ix_refresh_tokens_id', 'refresh_tokens')
    op.drop_table('refresh_tokens')
    
    op.drop_constraint('fk_clinics_contact_id', 'clinics', type_='foreignkey')
    
    op.drop_index('ix_users_email', 'users')
    op.drop_index('ix_users_id', 'users')
    op.drop_table('users')
    
    op.drop_index('ix_clinics_id', 'clinics')
    op.drop_table('clinics')
    
    op.execute('DROP TYPE userrole')
