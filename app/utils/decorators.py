from functools import wraps
from uuid import UUID

from flask import current_app
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models import User, UserRole
from app.services.auth_service import UnauthorizedError
from app.utils.exceptions import ForbiddenError


def role_required(*roles: str):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user_id = UUID(str(get_jwt_identity()))
            user = db.session.get(User, user_id)
            if user is None or not user.is_active:
                raise UnauthorizedError("Invalid or expired access token")
            if user.role.value not in roles:
                raise ForbiddenError("You do not have permission to access this resource")
            return fn(user, *args, **kwargs)

        return wrapper

    return decorator


def owner_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = UUID(str(get_jwt_identity()))
        user = db.session.get(User, user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError("Invalid or expired access token")

        owner_email = current_app.config.get("BOOKVERSE_OWNER_EMAIL", "").strip().lower()
        if not owner_email or user.email.strip().lower() != owner_email:
            raise ForbiddenError("Owner access is not enabled for this account")

        return fn(user, *args, **kwargs)

    return wrapper
