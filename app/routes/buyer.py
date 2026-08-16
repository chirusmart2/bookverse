import uuid

from flask import Blueprint, jsonify, request
from marshmallow import ValidationError

from app.schemas.cart import CartItemSchema, CartUpdateSchema
from app.schemas.order import CheckoutSchema
from app.schemas.rating import RatingSchema
from app.services.book_service import BookService
from app.services.cart_service import CartService
from app.services.checkout_service import CheckoutService
from app.services.order_service import OrderService
from app.services.rating_service import RatingService
from app.utils.decorators import role_required
from app.utils.errors import error_response

buyer_bp = Blueprint("buyer", __name__)

cart_item_schema = CartItemSchema()
cart_update_schema = CartUpdateSchema()
checkout_schema = CheckoutSchema()
rating_schema = RatingSchema()


def _pagination_meta(pagination):
    return {
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "pages": pagination.pages,
    }


@buyer_bp.route("/books", methods=["GET"])
@role_required("buyer")
def list_books(user):
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    q = request.args.get("q")
    seller_id = request.args.get("seller_id")
    seller_uuid = uuid.UUID(seller_id) if seller_id else None
    pagination = BookService.list_catalog(q, seller_uuid, page, per_page)
    return jsonify(
        {
            "books": [b.to_dict(include_seller=True) for b in pagination.items],
            "meta": _pagination_meta(pagination),
        }
    )


@buyer_bp.route("/books/<uuid:book_id>", methods=["GET"])
@role_required("buyer")
def get_book(user, book_id):
    book = BookService.get_catalog_book(book_id)
    return jsonify({"book": book.to_dict(include_seller=True)})


@buyer_bp.route("/cart", methods=["GET"])
@role_required("buyer")
def get_cart(user):
    cart = CartService.get_cart(user)
    return jsonify({"cart": cart})


@buyer_bp.route("/cart/items", methods=["POST"])
@role_required("buyer")
def add_cart_item(user):
    try:
        data = cart_item_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    CartService.add_or_update_item(user, data["book_id"], data["quantity"])
    return jsonify({"cart": CartService.get_cart(user)}), 200


@buyer_bp.route("/cart/items/<uuid:book_id>", methods=["PATCH"])
@role_required("buyer")
def update_cart_item(user, book_id):
    try:
        data = cart_update_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    CartService.update_item_quantity(user, book_id, data["quantity"])
    return jsonify({"cart": CartService.get_cart(user)})


@buyer_bp.route("/cart/items/<uuid:book_id>", methods=["DELETE"])
@role_required("buyer")
def remove_cart_item(user, book_id):
    CartService.remove_item(user, book_id)
    return jsonify({"cart": CartService.get_cart(user)})


@buyer_bp.route("/cart", methods=["DELETE"])
@role_required("buyer")
def clear_cart(user):
    CartService.clear_cart(user)
    return jsonify({"cart": CartService.get_cart(user)})


@buyer_bp.route("/checkout", methods=["POST"])
@role_required("buyer")
def checkout(user):
    try:
        data = checkout_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    orders = CheckoutService.checkout(user, data["shipping"])
    return jsonify({"orders": [o.to_dict() for o in orders]}), 201


@buyer_bp.route("/orders", methods=["GET"])
@role_required("buyer")
def list_orders(user):
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    pagination = OrderService.list_buyer_orders(user.id, page, per_page)
    return jsonify(
        {
            "orders": [o.to_dict() for o in pagination.items],
            "meta": _pagination_meta(pagination),
        }
    )


@buyer_bp.route("/orders/<uuid:order_id>", methods=["GET"])
@role_required("buyer")
def get_order(user, order_id):
    order = OrderService.get_buyer_order(user.id, order_id)
    return jsonify({"order": order.to_dict()})


@buyer_bp.route("/orders/<uuid:order_id>/cancel", methods=["POST"])
@role_required("buyer")
def cancel_order(user, order_id):
    order = OrderService.buyer_cancel(user, order_id)
    return jsonify({"order": order.to_dict()})


@buyer_bp.route("/orders/<uuid:order_id>/rate-seller", methods=["POST"])
@role_required("buyer")
def rate_seller(user, order_id):
    try:
        data = rating_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    rating = RatingService.rate_seller(
        user, order_id, data["rating"], data.get("comment")
    )
    return jsonify({"rating": rating.to_dict()}), 201


@buyer_bp.route("/orders/<uuid:order_id>/rate-courier", methods=["POST"])
@role_required("buyer")
def rate_courier(user, order_id):
    try:
        data = rating_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    rating = RatingService.rate_courier(
        user, order_id, data["rating"], data.get("comment")
    )
    return jsonify({"rating": rating.to_dict()}), 201


@buyer_bp.route("/couriers", methods=["GET"])
@role_required("buyer")
def list_couriers(user):
    couriers = RatingService.list_active_couriers()
    return jsonify({"couriers": [c.to_dict() for c in couriers]})


@buyer_bp.route("/sellers/<uuid:seller_id>/reviews", methods=["GET"])
@role_required("buyer")
def get_seller_reviews(user, seller_id):
    reviews = RatingService.get_seller_reviews(seller_id)
    return jsonify({"reviews": [r.to_dict() for r in reviews]})


@buyer_bp.route("/couriers/<uuid:courier_id>/reviews", methods=["GET"])
@role_required("buyer")
def get_courier_reviews(user, courier_id):
    reviews = RatingService.get_courier_reviews(courier_id)
    return jsonify({"reviews": [r.to_dict() for r in reviews]})
