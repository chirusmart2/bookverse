import uuid
from decimal import Decimal

from app.extensions import db
from app.models import Book, BookStatus, CartItem, User
from app.utils.exceptions import BadRequestError, NotFoundError


class CartService:
    @staticmethod
    def get_cart(buyer: User) -> dict:
        items = CartItem.query.filter_by(buyer_id=buyer.id).all()
        lines = []
        total = Decimal("0")
        by_seller: dict[str, Decimal] = {}

        for item in items:
            book = item.book
            if book is None:
                continue
            line_total = book.price * item.quantity
            total += line_total
            seller_key = str(book.seller_id)
            by_seller[seller_key] = by_seller.get(seller_key, Decimal("0")) + line_total
            lines.append(
                {
                    "id": str(item.id),
                    "book_id": str(book.id),
                    "book": book.to_dict(),
                    "quantity": item.quantity,
                    "unit_price": str(book.price),
                    "line_total": str(line_total),
                    "available": book.status == BookStatus.active and book.stock >= item.quantity,
                }
            )

        return {
            "items": lines,
            "subtotal": str(total),
            "subtotals_by_seller": {k: str(v) for k, v in by_seller.items()},
            "item_count": len(lines),
        }

    @staticmethod
    def add_or_update_item(buyer: User, book_id: uuid.UUID, quantity: int) -> CartItem:
        book = db.session.get(Book, book_id)
        if book is None or book.status != BookStatus.active:
            raise BadRequestError("Book is not available")
        if book.stock < quantity:
            raise BadRequestError("Insufficient stock")

        item = CartItem.query.filter_by(buyer_id=buyer.id, book_id=book_id).first()
        if item:
            item.quantity = quantity
        else:
            item = CartItem(buyer_id=buyer.id, book_id=book_id, quantity=quantity)
            db.session.add(item)
        db.session.commit()
        return item

    @staticmethod
    def update_item_quantity(buyer: User, book_id: uuid.UUID, quantity: int) -> CartItem:
        item = CartItem.query.filter_by(buyer_id=buyer.id, book_id=book_id).first()
        if item is None:
            raise NotFoundError("Cart item not found")
        book = item.book
        if book.status != BookStatus.active:
            raise BadRequestError("Book is not available")
        if book.stock < quantity:
            raise BadRequestError("Insufficient stock")
        item.quantity = quantity
        db.session.commit()
        return item

    @staticmethod
    def remove_item(buyer: User, book_id: uuid.UUID) -> None:
        item = CartItem.query.filter_by(buyer_id=buyer.id, book_id=book_id).first()
        if item is None:
            raise NotFoundError("Cart item not found")
        db.session.delete(item)
        db.session.commit()

    @staticmethod
    def clear_cart(buyer: User) -> None:
        CartItem.query.filter_by(buyer_id=buyer.id).delete()
        db.session.commit()
