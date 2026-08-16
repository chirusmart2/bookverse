import uuid

from flask import Blueprint, jsonify, request
from marshmallow import ValidationError

from app.schemas.book import BookBulkCreateSchema, BookCreateSchema, BookUpdateSchema
from app.schemas.order import OrderStatusUpdateSchema
from app.services.book_service import BookService
from app.services.order_service import OrderService
from app.services.rating_service import RatingService
from app.utils.decorators import role_required
from app.utils.errors import error_response

seller_bp = Blueprint("seller", __name__)

book_create_schema = BookCreateSchema()
book_update_schema = BookUpdateSchema()
book_bulk_schema = BookBulkCreateSchema()
order_status_schema = OrderStatusUpdateSchema()


def _pagination_meta(pagination):
    return {
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "pages": pagination.pages,
    }


@seller_bp.route("/books", methods=["GET"])
@role_required("seller")
def list_books(user):
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    status = request.args.get("status")
    pagination = BookService.list_seller_books(user.id, status, page, per_page)
    counts = BookService.get_seller_book_counts(user.id)
    return jsonify(
        {
            "books": [b.to_dict() for b in pagination.items],
            "meta": _pagination_meta(pagination),
            "counts": counts,
        }
    )


@seller_bp.route("/books", methods=["POST"])
@role_required("seller")
def create_book(user):
    try:
        data = book_create_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    book = BookService.create_book(user, data)
    return jsonify({"book": book.to_dict()}), 201


@seller_bp.route("/books/bulk", methods=["POST"])
@role_required("seller")
def bulk_create_books(user):
    try:
        data = book_bulk_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    books = BookService.bulk_create_books(user, data["books"])
    return jsonify({"books": [b.to_dict() for b in books], "count": len(books)}), 201


@seller_bp.route("/books/<uuid:book_id>", methods=["GET"])
@role_required("seller")
def get_book(user, book_id):
    book = BookService.get_seller_book(user.id, book_id)
    return jsonify({"book": book.to_dict()})


@seller_bp.route("/books/<uuid:book_id>", methods=["PATCH"])
@role_required("seller")
def update_book(user, book_id):
    try:
        data = book_update_schema.load(request.get_json() or {}, partial=True)
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    if not data:
        return error_response("validation_error", "No fields to update", status_code=400)

    book = BookService.update_book(user.id, book_id, data)
    return jsonify({"book": book.to_dict()})


@seller_bp.route("/books/<uuid:book_id>", methods=["DELETE"])
@role_required("seller")
def delete_book(user, book_id):
    book = BookService.deactivate_book(user.id, book_id)
    return jsonify({"book": book.to_dict()})


@seller_bp.route("/orders", methods=["GET"])
@role_required("seller")
def list_orders(user):
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)
    status = request.args.get("status")
    pagination = OrderService.list_seller_orders(user.id, status, page, per_page)
    return jsonify(
        {
            "orders": [o.to_dict() for o in pagination.items],
            "meta": _pagination_meta(pagination),
        }
    )


@seller_bp.route("/couriers", methods=["GET"])
@role_required("seller")
def list_couriers(user):
    couriers = RatingService.list_active_couriers()
    return jsonify({"couriers": [c.to_dict() for c in couriers]})


@seller_bp.route("/dashboard", methods=["GET"])
@role_required("seller")
def dashboard(user):
    counts = OrderService.seller_dashboard_counts(user.id)
    return jsonify({"order_counts": counts})


@seller_bp.route("/orders/<uuid:order_id>", methods=["GET"])
@role_required("seller")
def get_order(user, order_id):
    order = OrderService.get_seller_order(user.id, order_id)
    return jsonify({"order": order.to_dict()})


@seller_bp.route("/orders/<uuid:order_id>/status", methods=["PATCH"])
@role_required("seller")
def update_order_status(user, order_id):
    try:
        data = order_status_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    order = OrderService.update_seller_status(
        user,
        order_id,
        data["status"],
        data.get("courier_partner_id"),
    )
    return jsonify({"order": order.to_dict()})


@seller_bp.route("/reviews", methods=["GET"])
@role_required("seller")
def get_reviews(user):
    seller_reviews = RatingService.get_seller_reviews(user.id)
    return jsonify({"reviews": [r.to_dict() for r in seller_reviews]})
