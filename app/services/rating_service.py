import uuid

from app.extensions import db
from app.models import CourierPartner, CourierRating, Order, OrderStatus, SellerRating, User
from app.services.auth_service import ConflictError
from app.services.order_service import OrderService
from app.utils.exceptions import BadRequestError


class RatingService:
    @staticmethod
    def rate_seller(buyer: User, order_id: uuid.UUID, rating: int, comment: str | None) -> SellerRating:
        order = OrderService.get_buyer_order(buyer.id, order_id)
        if order.status != OrderStatus.delivered:
            raise BadRequestError("Can only rate delivered orders")
        if order.seller_rating:
            raise ConflictError("Seller already rated for this order")

        seller_rating = SellerRating(
            order_id=order.id,
            buyer_id=buyer.id,
            seller_id=order.seller_id,
            rating=rating,
            comment=comment,
        )
        db.session.add(seller_rating)
        db.session.commit()
        return seller_rating

    @staticmethod
    def rate_courier(
        buyer: User, order_id: uuid.UUID, rating: int, comment: str | None
    ) -> CourierRating:
        order = OrderService.get_buyer_order(buyer.id, order_id)
        if order.status != OrderStatus.delivered:
            raise BadRequestError("Can only rate delivered orders")
        if not order.courier_partner_id:
            raise BadRequestError("No courier assigned to this order")
        if order.courier_rating:
            raise ConflictError("Courier already rated for this order")

        courier_rating = CourierRating(
            order_id=order.id,
            buyer_id=buyer.id,
            courier_partner_id=order.courier_partner_id,
            rating=rating,
            comment=comment,
        )
        db.session.add(courier_rating)
        db.session.commit()
        return courier_rating

    @staticmethod
    def list_active_couriers() -> list[CourierPartner]:
        return CourierPartner.query.filter_by(is_active=True).order_by(CourierPartner.name).all()

    @staticmethod
    def get_seller_reviews(seller_id: uuid.UUID) -> list[SellerRating]:
        return SellerRating.query.filter_by(seller_id=seller_id).order_by(SellerRating.created_at.desc()).all()

    @staticmethod
    def get_courier_reviews(courier_partner_id: uuid.UUID) -> list[CourierRating]:
        return CourierRating.query.filter_by(courier_partner_id=courier_partner_id).order_by(CourierRating.created_at.desc()).all()
