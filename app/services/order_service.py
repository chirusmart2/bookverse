import uuid

from app.extensions import db
from app.models import (
    CourierPartner,
    Order,
    OrderStatus,
    PaymentStatus,
    User,
)
from app.utils.exceptions import BadRequestError, NotFoundError


class OrderService:
    @staticmethod
    def get_buyer_order(buyer_id: uuid.UUID, order_id: uuid.UUID) -> Order:
        order = db.session.get(Order, order_id)
        if order is None or order.buyer_id != buyer_id:
            raise NotFoundError("Order not found")
        return order

    @staticmethod
    def get_seller_order(seller_id: uuid.UUID, order_id: uuid.UUID) -> Order:
        order = db.session.get(Order, order_id)
        if order is None or order.seller_id != seller_id:
            raise NotFoundError("Order not found")
        return order

    @staticmethod
    def list_buyer_orders(buyer_id: uuid.UUID, page: int, per_page: int):
        return (
            Order.query.filter_by(buyer_id=buyer_id)
            .order_by(Order.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

    @staticmethod
    def list_seller_orders(seller_id: uuid.UUID, status: str | None, page: int, per_page: int):
        query = Order.query.filter_by(seller_id=seller_id)
        if status:
            query = query.filter_by(status=OrderStatus(status))
        return query.order_by(Order.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    @staticmethod
    def buyer_cancel(buyer: User, order_id: uuid.UUID) -> Order:
        order = OrderService.get_buyer_order(buyer.id, order_id)
        if order.status != OrderStatus.placed:
            raise BadRequestError("Only placed orders can be cancelled by buyer")
        order.status = OrderStatus.cancelled
        _restore_stock(order)
        db.session.commit()
        return order

    @staticmethod
    def update_seller_status(
        seller: User,
        order_id: uuid.UUID,
        status: str,
        courier_partner_id: uuid.UUID | None = None,
    ) -> Order:
        order = OrderService.get_seller_order(seller.id, order_id)
        new_status = OrderStatus(status)

        if new_status == OrderStatus.confirmed:
            if order.status != OrderStatus.placed:
                raise BadRequestError("Can only confirm placed orders")
            order.status = new_status

        elif new_status == OrderStatus.shipped:
            if order.status != OrderStatus.confirmed:
                raise BadRequestError("Can only ship confirmed orders")
            if not courier_partner_id:
                raise BadRequestError("Courier partner is required when shipping")
            courier = db.session.get(CourierPartner, courier_partner_id)
            if courier is None or not courier.is_active:
                raise BadRequestError("Invalid courier partner")
            order.courier_partner_id = courier_partner_id
            order.status = new_status

        elif new_status == OrderStatus.delivered:
            if order.status != OrderStatus.shipped:
                raise BadRequestError("Can only deliver shipped orders")
            order.status = new_status
            order.payment_status = PaymentStatus.collected

        elif new_status == OrderStatus.cancelled:
            if order.status not in (OrderStatus.placed, OrderStatus.confirmed):
                raise BadRequestError("Cannot cancel order in current status")
            order.status = new_status
            _restore_stock(order)
        else:
            raise BadRequestError("Invalid status transition")

        db.session.commit()
        return order

    @staticmethod
    def seller_dashboard_counts(seller_id: uuid.UUID) -> dict:
        counts = {}
        for status in OrderStatus:
            counts[status.value] = Order.query.filter_by(
                seller_id=seller_id, status=status
            ).count()
        return counts


def _restore_stock(order: Order) -> None:
    for item in order.items:
        book = item.book
        if book:
            book.stock += item.quantity
