"""phase11 document permissions and ai workspace scope

Revision ID: b7e2a1c4d9f0
Revises: a3f5e9c1d270
Create Date: 2026-08-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e2a1c4d9f0'
down_revision: Union[str, Sequence[str], None] = 'a3f5e9c1d270'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('document_permissions',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('document_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.alter_column('ai_conversations', 'project_id', nullable=True)
    op.add_column('ai_conversations', sa.Column('workspace_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'ai_conversations_workspace_id_fkey', 'ai_conversations', 'workspaces', ['workspace_id'], ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('ai_conversations_workspace_id_fkey', 'ai_conversations', type_='foreignkey')
    op.drop_column('ai_conversations', 'workspace_id')
    op.alter_column('ai_conversations', 'project_id', nullable=False)

    op.drop_table('document_permissions')
