import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import db


class OrderStatus(enum.Enum):
    placed = "placed"
    confirmed = "confirmed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class PaymentMethod(enum.Enum):
    cod = "cod"


class PaymentStatus(enum.Enum):
    pending = "pending"
    collected = "collected"


class Order(db.Model):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    buyer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), nullable=False, default=OrderStatus.placed
    )
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod), nullable=False, default=PaymentMethod.cod
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), nullable=False, default=PaymentStatus.pending
    )
    courier_partner_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courier_partners.id"), nullable=True
    )
    shipping_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    shipping_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    shipping_city: Mapped[str] = mapped_column(String(100), nullable=False)
    shipping_state: Mapped[str] = mapped_column(String(100), nullable=False)
    shipping_postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    shipping_country: Mapped[str] = mapped_column(String(100), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="buyer_orders")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="seller_orders")
    courier_partner = relationship("CourierPartner", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    seller_rating = relationship("SellerRating", back_populates="order", uselist=False)
    courier_rating = relationship("CourierRating", back_populates="order", uselist=False)

    def to_dict(self, include_items: bool = True) -> dict:
        data = {
            "id": str(self.id),
            "buyer_id": str(self.buyer_id),
            "seller_id": str(self.seller_id),
            "status": self.status.value,
            "payment_method": self.payment_method.value,
            "payment_status": self.payment_status.value,
            "courier_partner_id": str(self.courier_partner_id) if self.courier_partner_id else None,
            "shipping": {
                "line1": self.shipping_line1,
                "line2": self.shipping_line2,
                "city": self.shipping_city,
                "state": self.shipping_state,
                "postal_code": self.shipping_postal_code,
                "country": self.shipping_country,
            },
            "subtotal": str(self.subtotal),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
        if self.courier_partner:
            data["courier"] = self.courier_partner.to_dict()
        if include_items:
            data["items"] = [item.to_dict() for item in self.items]
        if self.seller_rating:
            data["seller_rating"] = self.seller_rating.to_dict()
        if self.courier_rating:
            data["courier_rating"] = self.courier_rating.to_dict()
        return data
