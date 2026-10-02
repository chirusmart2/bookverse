"""Add per-buyer recently viewed book history.

Revision ID: 4c7f1bce92a1
Revises: 91a28289c5c5
Create Date: 2026-10-02
"""
from alembic import op
import sqlalchemy as sa


revision = "4c7f1bce92a1"
down_revision = "91a28289c5c5"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "book_views",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("buyer_id", sa.UUID(), nullable=False),
        sa.Column("book_id", sa.UUID(), nullable=False),
        sa.Column("views", sa.Integer(), nullable=False),
        sa.Column("viewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["buyer_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("buyer_id", "book_id", name="uq_book_views_buyer_book"),
    )
    op.create_index("ix_book_views_buyer_id", "book_views", ["buyer_id"])


def downgrade():
    op.drop_index("ix_book_views_buyer_id", table_name="book_views")
    op.drop_table("book_views")
