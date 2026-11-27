"""make project budget year nullable

Revision ID: e4a7c9d20b58
Revises: 145cbcf6adff
Create Date: 2026-11-27 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e4a7c9d20b58"
down_revision: Union[str, Sequence[str], None] = "145cbcf6adff"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        "tblprojectbudget",
        "year",
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "tblprojectbudget",
        "year",
        existing_type=sa.Integer(),
        nullable=False,
    )
