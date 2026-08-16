from functools import wraps
from uuid import UUID

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
