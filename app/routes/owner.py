from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from app.extensions import db
from app.models import Book, BookStatus, Order, OwnerAction, RefreshToken, User
from app.utils.decorators import owner_required
from app.utils.exceptions import BadRequestError, ForbiddenError

owner_bp = Blueprint("owner", __name__)


def _pagination_meta(pagination):
    return {
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "pages": pagination.pages,
    }


def _user_dict(user):
    return {**user.to_dict(), "is_active": user.is_active}


def _record_action(actor, action, target_type, target_id, details):
    db.session.add(OwnerAction(
        actor_user_id=actor.id,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        details=details,
    ))


@owner_bp.route("/me", methods=["GET"])
@owner_required
def owner_me(user):
    return jsonify({"owner": _user_dict(user)})


@owner_bp.route("/dashboard", methods=["GET"])
@owner_required
def dashboard(_user):
    user_total = User.query.count()
    book_total = Book.query.count()
    return jsonify({
        "users": {"total": user_total, "active": User.query.filter_by(is_active=True).count()},
        "books": {
            "total": book_total,
            "active": Book.query.filter_by(status=BookStatus.active).count(),
            "inactive": Book.query.filter_by(status=BookStatus.inactive).count(),
        },
        "orders": {"total": Order.query.count()},
    })


@owner_bp.route("/users", methods=["GET"])
@owner_required
def list_users(_user):
    page = max(request.args.get("page", 1, type=int), 1)
    per_page = min(max(request.args.get("per_page", 25, type=int), 1), 100)
    query = User.query
    search = request.args.get("q", "").strip()
    if search:
        term = f"%{search}%"
        query = query.filter(or_(User.email.ilike(term), User.first_name.ilike(term), User.last_name.ilike(term)))

    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "users": [_user_dict(user) for user in pagination.items],
        "meta": _pagination_meta(pagination),
    })


@owner_bp.route("/users/<uuid:user_id>/status", methods=["PATCH"])
@owner_required
def set_user_status(owner, user_id):
    data = request.get_json(silent=True) or {}
    is_active = data.get("is_active")
    if type(is_active) is not bool:
        raise BadRequestError("is_active must be true or false")

    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"error": "not_found", "message": "User not found"}), 404
    if user.id == owner.id or user.email.strip().lower() == owner.email.strip().lower():
        raise ForbiddenError("The owner account cannot be suspended")

    user.is_active = is_active
    if not is_active:
        now = datetime.now(timezone.utc)
        RefreshToken.query.filter_by(user_id=user.id, revoked_at=None).update(
            {"revoked_at": now}, synchronize_session=False
        )
    _record_action(owner, "user_status_changed", "user", user.id, {"is_active": is_active})
    db.session.commit()
    return jsonify({"user": _user_dict(user)})


@owner_bp.route("/books", methods=["GET"])
@owner_required
def list_books(_user):
    page = max(request.args.get("page", 1, type=int), 1)
    per_page = min(max(request.args.get("per_page", 25, type=int), 1), 100)
    query = Book.query.join(User, Book.seller_id == User.id)
    search = request.args.get("q", "").strip()
    if search:
        term = f"%{search}%"
        query = query.filter(or_(Book.title.ilike(term), Book.author.ilike(term), User.email.ilike(term)))
    status = request.args.get("status")
    if status in {BookStatus.active.value, BookStatus.inactive.value}:
        query = query.filter(Book.status == BookStatus(status))

    pagination = query.order_by(Book.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    books = []
    for book in pagination.items:
        item = book.to_dict(include_seller=True)
        item["seller_email"] = book.seller.email
        books.append(item)
    return jsonify({"books": books, "meta": _pagination_meta(pagination)})


@owner_bp.route("/books/<uuid:book_id>/status", methods=["PATCH"])
@owner_required
def set_book_status(owner, book_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in {BookStatus.active.value, BookStatus.inactive.value}:
        raise BadRequestError("status must be active or inactive")

    book = db.session.get(Book, book_id)
    if book is None:
        return jsonify({"error": "not_found", "message": "Book not found"}), 404
    book.status = BookStatus(status)
    _record_action(owner, "book_status_changed", "book", book.id, {"status": status})
    db.session.commit()
    return jsonify({"book": book.to_dict(include_seller=True)})


@owner_bp.route("/audit", methods=["GET"])
@owner_required
def audit_log(_user):
    page = max(request.args.get("page", 1, type=int), 1)
    per_page = min(max(request.args.get("per_page", 25, type=int), 1), 100)
    pagination = OwnerAction.query.order_by(OwnerAction.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "actions": [{
            "id": str(action.id),
            "actor_user_id": str(action.actor_user_id) if action.actor_user_id else None,
            "action": action.action,
            "target_type": action.target_type,
            "target_id": action.target_id,
            "details": action.details,
            "created_at": action.created_at.isoformat(),
        } for action in pagination.items],
        "meta": _pagination_meta(pagination),
    })
