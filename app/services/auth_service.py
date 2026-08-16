import hashlib
import uuid
from datetime import datetime, timezone

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token

from app.extensions import db
from app.models import RefreshToken, User, UserRole


class AuthError(Exception):
    pass


class ConflictError(Exception):
    pass


class UnauthorizedError(Exception):
    pass


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _normalize_email(email: str) -> str:
    return email.strip().lower()


class AuthService:
    @staticmethod
    def register_user(email: str, password: str, role: str, first_name: str, last_name: str) -> User:
        normalized_email = _normalize_email(email)

        existing = User.query.filter_by(email=normalized_email).first()
        if existing:
            raise ConflictError("Email already registered")

        user = User(
            email=normalized_email,
            role=UserRole(role),
            first_name=first_name.strip(),
            last_name=last_name.strip(),
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def authenticate(email: str, password: str) -> tuple[User, str, str, int]:
        normalized_email = _normalize_email(email)
        user = User.query.filter_by(email=normalized_email).first()

        if user is None or not user.check_password(password) or not user.is_active:
            raise UnauthorizedError("Invalid email or password")

        access_token, refresh_token, expires_in = AuthService._create_token_pair(user)
        return user, access_token, refresh_token, expires_in

    @staticmethod
    def refresh_tokens(refresh_token: str) -> tuple[str, str, int]:
        try:
            decoded = decode_token(refresh_token)
        except Exception as exc:
            raise UnauthorizedError("Invalid or expired refresh token") from exc

        if decoded.get("type") != "refresh":
            raise UnauthorizedError("Invalid or expired refresh token")

        token_hash = _hash_token(refresh_token)
        stored = RefreshToken.query.filter_by(token_hash=token_hash).first()

        if stored is None or not stored.is_active:
            raise UnauthorizedError("Invalid or expired refresh token")

        user = db.session.get(User, stored.user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError("Invalid or expired refresh token")

        stored.revoked_at = datetime.now(timezone.utc)

        access_token, new_refresh_token, expires_in = AuthService._create_token_pair(user)
        db.session.commit()
        return access_token, new_refresh_token, expires_in

    @staticmethod
    def revoke_refresh_token(refresh_token: str) -> None:
        token_hash = _hash_token(refresh_token)
        stored = RefreshToken.query.filter_by(token_hash=token_hash).first()

        if stored is not None and stored.revoked_at is None:
            stored.revoked_at = datetime.now(timezone.utc)
            db.session.commit()

    @staticmethod
    def get_user_by_id(user_id: str) -> User | None:
        try:
            uid = uuid.UUID(user_id)
        except ValueError:
            return None
        return db.session.get(User, uid)

    @staticmethod
    def _create_token_pair(user: User) -> tuple[str, str, int]:
        identity = str(user.id)
        expires_in = int(current_app.config["JWT_ACCESS_TOKEN_EXPIRES"].total_seconds())

        access_token = create_access_token(identity=identity)
        refresh_token = create_refresh_token(identity=identity)

        decoded_refresh = decode_token(refresh_token)
        expires_at = datetime.fromtimestamp(decoded_refresh["exp"], tz=timezone.utc)

        stored = RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(refresh_token),
            expires_at=expires_at,
        )
        db.session.add(stored)
        db.session.commit()

        return access_token, refresh_token, expires_in
