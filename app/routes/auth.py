from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from app.schemas.auth import (
    LoginSchema,
    LogoutSchema,
    RefreshTokenSchema,
    RegisterSchema,
    UserResponseSchema,
)
from app.services.auth_service import AuthService, UnauthorizedError
from app.utils.errors import error_response

auth_bp = Blueprint("auth", __name__)

register_schema = RegisterSchema()
login_schema = LoginSchema()
refresh_schema = RefreshTokenSchema()
logout_schema = LogoutSchema()
user_response_schema = UserResponseSchema()


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = register_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    user = AuthService.register_user(
        email=data["email"],
        password=data["password"],
        role=data["role"],
        first_name=data["first_name"],
        last_name=data["last_name"],
    )
    return jsonify({"user": user_response_schema.dump(user.to_dict())}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = login_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    user, access_token, refresh_token, expires_in = AuthService.authenticate(
        email=data["email"],
        password=data["password"],
    )
    return jsonify(
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": expires_in,
            "user": user_response_schema.dump(user.to_dict()),
        }
    ), 200


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    try:
        data = refresh_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    access_token, new_refresh_token, expires_in = AuthService.refresh_tokens(
        data["refresh_token"]
    )
    return jsonify(
        {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "Bearer",
            "expires_in": expires_in,
        }
    ), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    try:
        data = logout_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("validation_error", "Invalid input", details=err.messages, status_code=400)

    AuthService.revoke_refresh_token(data["refresh_token"])
    return "", 204


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = AuthService.get_user_by_id(user_id)

    if user is None or not user.is_active:
        raise UnauthorizedError("Invalid or expired access token")

    return jsonify({"user": user_response_schema.dump(user.to_dict())}), 200
