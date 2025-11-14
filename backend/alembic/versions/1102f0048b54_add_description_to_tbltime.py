"""add description to tbltime

Revision ID: 1102f0048b54
Revises: 5f0a29fc86de
Create Date: 2025-11-14 20:14:39.330314

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1102f0048b54"
down_revision: Union[str, Sequence[str], None] = "5f0a29fc86de"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("tbltime", sa.Column("description", sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("tbltime", "description")
