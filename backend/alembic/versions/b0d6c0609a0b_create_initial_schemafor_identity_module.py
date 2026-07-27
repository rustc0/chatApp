"""create initial schema for identity module

Revision ID: b0d6c0609a0b
Revises: 
Create Date: 2026-07-27 17:37:10.486059

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b0d6c0609a0b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'users',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('username', sa.String(length=32), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('bio', sa.String(length=512), server_default=sa.text("''"), nullable=False),
        sa.Column('avatar_url', sa.String(length=512), server_default=sa.text("''"), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('users_pkey')),
        sa.UniqueConstraint('email', name=op.f('users_email_key')),
        sa.UniqueConstraint('username', name=op.f('users_username_key')),
    )
    op.create_index(op.f('users_username_lower_idx'), 'users', [sa.literal_column('lower(username)')], unique=True)
    op.create_index(op.f('users_email_lower_idx'), 'users', [sa.literal_column('lower(email)')], unique=True)
    op.create_table(
        'sessions',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('last_used_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('sessions_user_id_fkey'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('sessions_pkey')),
        sa.UniqueConstraint('token_hash', name=op.f('sessions_token_hash_key')),
    )
    op.create_index(op.f('sessions_user_id_idx'), 'sessions', ['user_id'], unique=False)
    op.create_index(op.f('sessions_expires_at_idx'), 'sessions', ['expires_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('sessions_expires_at_idx'), table_name='sessions')
    op.drop_index(op.f('sessions_user_id_idx'), table_name='sessions')
    op.drop_table('sessions')
    op.drop_index(op.f('users_email_lower_idx'), table_name='users')
    op.drop_index(op.f('users_username_lower_idx'), table_name='users')
    op.drop_table('users')
