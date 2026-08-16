from flask import jsonify
from flask_jwt_extended.exceptions import JWTExtendedException
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException

from app.services.auth_service import AuthError, ConflictError, UnauthorizedError
from app.utils.exceptions import BadRequestError, ForbiddenError, NotFoundError


def error_response(error_code: str, message: str, details=None, status_code: int = 400):
    payload = {"error": error_code, "message": message}
    if details is not None:
        payload["details"] = details
    return jsonify(payload), status_code


def register_error_handlers(app):
    @app.errorhandler(ValidationError)
    def handle_validation_error(err):
        return error_response(
            "validation_error",
            "Invalid input",
            details=err.messages,
            status_code=400,
        )

    @app.errorhandler(ConflictError)
    def handle_conflict(err):
        return error_response("conflict", str(err), status_code=409)

    @app.errorhandler(NotFoundError)
    def handle_not_found(err):
        return error_response("not_found", str(err), status_code=404)

    @app.errorhandler(ForbiddenError)
    def handle_forbidden(err):
        return error_response("forbidden", str(err), status_code=403)

    @app.errorhandler(BadRequestError)
    def handle_bad_request(err):
        return error_response("bad_request", str(err), status_code=400)

    @app.errorhandler(UnauthorizedError)
    def handle_unauthorized(err):
        return error_response("unauthorized", str(err), status_code=401)

    @app.errorhandler(JWTExtendedException)
    def handle_jwt_error(err):
        return error_response("unauthorized", "Invalid or expired access token", status_code=401)

    @app.errorhandler(AuthError)
    def handle_auth_error(err):
        return error_response("auth_error", str(err), status_code=400)

    @app.errorhandler(HTTPException)
    def handle_http_exception(err):
        return error_response(
            err.name.lower().replace(" ", "_"),
            err.description,
            status_code=err.code,
        )

    @app.errorhandler(Exception)
    def handle_unexpected(err):
        app.logger.exception("Unexpected error: %s", err)
        return error_response("internal_error", "An unexpected error occurred", status_code=500)
