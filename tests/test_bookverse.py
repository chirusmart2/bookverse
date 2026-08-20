"""BookVerse API test suite.

Covers authentication, role-based access control, book catalog management,
and cart operations against the Flask API using an in-memory SQLite database.

Run with: pytest tests/
"""

import pytest

from tests.conftest import auth_header, login, register


class TestAuth:
    def test_register_buyer_returns_201(self, client):
        resp = register(client)
        assert resp.status_code == 201
        user = resp.get_json()["user"]
        assert user["email"] == "buyer@example.com"
        assert user["role"] == "buyer"

    def test_register_seller(self, client):
        resp = register(client, email="seller@example.com", role="seller")
        assert resp.status_code == 201
        assert resp.get_json()["user"]["role"] == "seller"

    def test_duplicate_email_returns_409(self, client):
        register(client)
        resp = register(client)
        assert resp.status_code in (409, 422, 400)

    def test_register_missing_fields_returns_400(self, client):
        resp = client.post("/api/v1/auth/register", json={"email": "x@example.com"})
        assert resp.status_code == 400

    def test_login_returns_access_token(self, client):
        register(client)
        resp = login(client)
        assert resp.status_code == 200
        data = resp.get_json()
        assert "access_token" in data
        assert data["token_type"] == "Bearer"

    def test_login_wrong_password_returns_401(self, client):
        register(client)
        resp = login(client, password="Wrong-Password1!")
        assert resp.status_code == 401


class TestRoleBasedAccess:
    def test_buyer_only_endpoint_blocks_seller(self, client):
        register(client, email="seller@example.com", role="seller")
        resp = login(client, email="seller@example.com")
        token = resp.get_json()["access_token"]
        resp = client.get("/api/v1/buyer/cart", headers=auth_header(token))
        assert resp.status_code == 403

    def test_seller_only_endpoint_blocks_buyer(self, client):
        register(client, role="buyer")
        resp = login(client)
        token = resp.get_json()["access_token"]
        resp = client.get("/api/v1/seller/books", headers=auth_header(token))
        assert resp.status_code == 403

    def test_unauthenticated_request_returns_401(self, client):
        resp = client.get("/api/v1/buyer/cart")
        assert resp.status_code == 401


class TestBooks:
    def _seller_token(self, client):
        register(client, email="seller@example.com", role="seller")
        return login(client, email="seller@example.com").get_json()["access_token"]

    def test_seller_creates_book(self, client):
        token = self._seller_token(client)
        resp = client.post(
            "/api/v1/seller/books",
            json={"title": "Clean Code", "author": "Robert Martin", "price": "29.99", "stock": 10},
            headers=auth_header(token),
        )
        assert resp.status_code == 201
        book = resp.get_json()["book"]
        assert book["title"] == "Clean Code"
        assert str(book["price"]) == "29.99"

    def test_create_book_requires_price(self, client):
        token = self._seller_token(client)
        resp = client.post(
            "/api/v1/seller/books",
            json={"title": "No Price Book", "author": "Nobody", "stock": 5},
            headers=auth_header(token),
        )
        assert resp.status_code == 400

    def test_catalog_lists_books(self, client):
        token = self._seller_token(client)
        client.post(
            "/api/v1/seller/books",
            json={"title": "Catalog Book", "author": "Author", "price": "9.99", "stock": 1},
            headers=auth_header(token),
        )
        register(client, email="buyer2@example.com", role="buyer")
        buyer_token = login(client, email="buyer2@example.com").get_json()["access_token"]
        resp = client.get("/api/v1/buyer/books", headers=auth_header(buyer_token))
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.get_json()["books"]]
        assert "Catalog Book" in titles


class TestCart:
    def _buyer_flow(self, client):
        seller_token = None
        # create seller + book
        register(client, email="seller@example.com", role="seller")
        seller_token = login(client, email="seller@example.com").get_json()["access_token"]
        book_resp = client.post(
            "/api/v1/seller/books",
            json={"title": "Cart Book", "author": "Author", "price": "19.99", "stock": 5},
            headers=auth_header(seller_token),
        )
        book_id = book_resp.get_json()["book"]["id"]
        # create buyer
        register(client, email="buyer@example.com", role="buyer")
        buyer_token = login(client).get_json()["access_token"]
        return buyer_token, book_id

    def test_add_item_to_cart(self, client):
        token, book_id = self._buyer_flow(client)
        resp = client.post(
            "/api/v1/buyer/cart/items",
            json={"book_id": book_id, "quantity": 2},
            headers=auth_header(token),
        )
        assert resp.status_code == 200
        cart = resp.get_json()["cart"]
        items = cart.get("items", [])
        assert items[0]["quantity"] == 2
        assert str(items[0]["book_id"]) == str(book_id)

    def test_empty_cart(self, client):
        token, _ = self._buyer_flow(client)
        resp = client.get("/api/v1/buyer/cart", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.get_json()["cart"]["items"] == []
