"""phase13 multipart upload

Revision ID: a4481d2e5e0a
Revises: 3eb095691550
Create Date: 2026-08-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a4481d2e5e0a'
down_revision: Union[str, Sequence[str], None] = '3eb095691550'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('document_versions', sa.Column('multipart_upload_id', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('document_versions', 'multipart_upload_id')
