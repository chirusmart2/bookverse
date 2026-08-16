import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


class CourierRating(db.Model):
    __tablename__ = "courier_ratings"
    __table_args__ = (UniqueConstraint("order_id", name="uq_courier_rating_order"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    buyer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    courier_partner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courier_partners.id", ondelete="CASCADE"), nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    order = relationship("Order", back_populates="courier_rating")
    buyer = relationship("User", foreign_keys=[buyer_id])

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "order_id": str(self.order_id),
            "courier_partner_id": str(self.courier_partner_id),
            "buyer_id": str(self.buyer_id),
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
            "buyer": {
                "first_name": self.buyer.first_name,
                "last_name": self.buyer.last_name,
            } if self.buyer else None,
        }
