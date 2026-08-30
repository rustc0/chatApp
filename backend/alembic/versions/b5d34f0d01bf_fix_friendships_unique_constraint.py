"""fix friendships unique constraint

Revision ID: b5d34f0d01bf
Revises: 9f963a409c0b
Create Date: 2026-08-30 22:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5d34f0d01bf'
down_revision: Union[str, Sequence[str], None] = '9f963a409c0b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # sender_id+status and receiver_id+status were unique, which capped every
    # user at one accepted (and one pending) friendship total. Replace with a
    # per-pair unique constraint and keep the columns indexed for lookups.
    op.drop_index('ix_friendships_sender_status', table_name='friendships')
    op.drop_index('ix_friendships_receiver_status', table_name='friendships')
    op.create_index('ix_friendships_sender_status', 'friendships', ['sender_id', 'status'], unique=False)
    op.create_index('ix_friendships_receiver_status', 'friendships', ['receiver_id', 'status'], unique=False)
    op.create_index('ux_friendships_sender_receiver', 'friendships', ['sender_id', 'receiver_id'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ux_friendships_sender_receiver', table_name='friendships')
    op.drop_index('ix_friendships_receiver_status', table_name='friendships')
    op.drop_index('ix_friendships_sender_status', table_name='friendships')
    op.create_index('ix_friendships_receiver_status', 'friendships', ['receiver_id', 'status'], unique=True)
    op.create_index('ix_friendships_sender_status', 'friendships', ['sender_id', 'status'], unique=True)
