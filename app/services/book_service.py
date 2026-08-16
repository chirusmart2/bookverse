import uuid
from decimal import Decimal

from sqlalchemy import or_

from app.extensions import db
from app.models import Book, BookStatus, User
from app.services.auth_service import ConflictError
from app.utils.exceptions import BadRequestError, NotFoundError


class BookService:
    @staticmethod
    def create_book(seller: User, data: dict) -> Book:
        book = Book(
            seller_id=seller.id,
            title=data["title"].strip(),
            author=data["author"].strip(),
            isbn=data.get("isbn"),
            description=data.get("description"),
            price=Decimal(str(data["price"])),
            stock=data["stock"],
            status=BookStatus.active,
        )
        db.session.add(book)
        try:
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            if "uq_books_seller_isbn" in str(exc):
                raise ConflictError("ISBN already exists for this seller") from exc
            raise
        return book

    @staticmethod
    def bulk_create_books(seller: User, books_data: list) -> list[Book]:
        books = []
        for data in books_data:
            books.append(
                Book(
                    seller_id=seller.id,
                    title=data["title"].strip(),
                    author=data["author"].strip(),
                    isbn=data.get("isbn"),
                    description=data.get("description"),
                    price=Decimal(str(data["price"])),
                    stock=data["stock"],
                    status=BookStatus.active,
                )
            )
        db.session.add_all(books)
        try:
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            if "uq_books_seller_isbn" in str(exc):
                raise ConflictError("One or more ISBNs already exist for this seller") from exc
            raise
        return books

    @staticmethod
    def get_seller_book(seller_id: uuid.UUID, book_id: uuid.UUID) -> Book:
        book = db.session.get(Book, book_id)
        if book is None or book.seller_id != seller_id:
            raise NotFoundError("Book not found")
        return book

    @staticmethod
    def list_seller_books(seller_id: uuid.UUID, status: str | None, page: int, per_page: int):
        query = Book.query.filter_by(seller_id=seller_id)
        if status:
            query = query.filter_by(status=BookStatus(status))
        pagination = query.order_by(Book.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        return pagination

    @staticmethod
    def get_seller_book_counts(seller_id: uuid.UUID) -> dict:
        active_count = Book.query.filter_by(seller_id=seller_id, status=BookStatus.active).count()
        inactive_count = Book.query.filter_by(seller_id=seller_id, status=BookStatus.inactive).count()
        return {
            "active": active_count,
            "inactive": inactive_count,
            "total": active_count + inactive_count,
        }

    @staticmethod
    def list_catalog(q: str | None, seller_id: uuid.UUID | None, page: int, per_page: int):
        query = Book.query.filter_by(status=BookStatus.active).filter(Book.stock > 0)
        if seller_id:
            query = query.filter_by(seller_id=seller_id)
        if q:
            pattern = f"%{q}%"
            query = query.filter(
                or_(Book.title.ilike(pattern), Book.author.ilike(pattern))
            )
        pagination = query.order_by(Book.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        return pagination

    @staticmethod
    def get_catalog_book(book_id: uuid.UUID) -> Book:
        book = db.session.get(Book, book_id)
        if book is None or book.status != BookStatus.active:
            raise NotFoundError("Book not found")
        return book

    @staticmethod
    def update_book(seller_id: uuid.UUID, book_id: uuid.UUID, data: dict) -> Book:
        book = BookService.get_seller_book(seller_id, book_id)
        if "title" in data:
            book.title = data["title"].strip()
        if "author" in data:
            book.author = data["author"].strip()
        if "isbn" in data:
            book.isbn = data["isbn"]
        if "description" in data:
            book.description = data["description"]
        if "price" in data:
            price = Decimal(str(data["price"]))
            if price <= 0:
                raise BadRequestError("Price must be greater than 0")
            book.price = price
        if "stock" in data:
            if data["stock"] < 0:
                raise BadRequestError("Stock cannot be negative")
            book.stock = data["stock"]
        if "status" in data:
            book.status = BookStatus(data["status"])
        try:
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            if "uq_books_seller_isbn" in str(exc):
                raise ConflictError("ISBN already exists for this seller") from exc
            raise
        return book

    @staticmethod
    def deactivate_book(seller_id: uuid.UUID, book_id: uuid.UUID) -> Book:
        book = BookService.get_seller_book(seller_id, book_id)
        book.status = BookStatus.inactive
        db.session.commit()
        return book
