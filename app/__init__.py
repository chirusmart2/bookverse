from datetime import timedelta

from flask import Flask
from flask_cors import CORS

from app.config import config_by_name
from app.extensions import db, jwt, migrate
from app.utils.errors import register_error_handlers


def create_app(config_name=None):
    if config_name is None:
        config_name = __import__("os").environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(
        seconds=app.config["JWT_ACCESS_TOKEN_EXPIRES"]
    )
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(
        seconds=app.config["JWT_REFRESH_TOKEN_EXPIRES"]
    )

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    origins = [o.strip() for o in app.config["CORS_ORIGINS"].split(",") if o.strip()]
    CORS(app, origins=origins, supports_credentials=True)

    register_error_handlers(app)

    from app import models  # noqa: F401 — register models with SQLAlchemy

    from app.routes.auth import auth_bp
    from app.routes.buyer import buyer_bp
    from app.routes.seller import seller_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(seller_bp, url_prefix="/api/v1/seller")
    app.register_blueprint(buyer_bp, url_prefix="/api/v1/buyer")

    @app.route("/health")
    def health():
        return {"status": "ok"}

    return app
