"""Shared pytest fixtures for the BookVerse test suite.

Uses an in-memory SQLite database so tests run without Docker or PostgreSQL.
"""

import os
import pytest

from app import create_app
from app.extensions import db as _db


@pytest.fixture(scope="session", autouse=True)
def _env():
    """Force the testing config and in-memory SQLite before app creation."""
    os.environ["FLASK_ENV"] = "testing"
    os.environ["TEST_DATABASE_URL"] = "sqlite:///:memory:"
    yield


@pytest.fixture(scope="session")
def app():
    application = create_app("testing")
    with application.app_context():
        _db.create_all()
        yield application
        _db.drop_all()


@pytest.fixture
def client(app):
    with app.test_client() as c:
        with app.app_context():
            yield c


@pytest.fixture(autouse=True)
def _reset_db(app):
    """Drop and recreate all tables between tests for isolation."""
    with app.app_context():
        _db.drop_all()
        _db.create_all()
        yield


def register(client, **kwargs):
    defaults = {
        "email": "buyer@example.com",
        "password": "Secure123!",
        "role": "buyer",
        "first_name": "Test",
        "last_name": "Buyer",
    }
    defaults.update(kwargs)
    return client.post("/api/v1/auth/register", json=defaults)


def login(client, email="buyer@example.com", password="Secure123!"):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def auth_header(access_token):
    return {"Authorization": f"Bearer {access_token}"}
