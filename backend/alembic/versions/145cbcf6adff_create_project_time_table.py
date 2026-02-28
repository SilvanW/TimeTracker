"""create project time table

Revision ID: 145cbcf6adff
Revises: 1102f0048b54
Create Date: 2026-02-28 15:51:52.099664

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "145cbcf6adff"
down_revision: Union[str, Sequence[str], None] = "1102f0048b54"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "tblprojecttime",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("time_budget_hours", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["project_id"], ["tblprojects.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("tblprojecttime")
