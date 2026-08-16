from collections import defaultdict
from decimal import Decimal

from app.extensions import db
from app.models import (
    Book,
    BookStatus,
    CartItem,
    Order,
    OrderItem,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    User,
)
from app.utils.exceptions import BadRequestError


class CheckoutService:
    @staticmethod
    def checkout(buyer: User, shipping: dict) -> list[Order]:
        cart_items = (
            CartItem.query.filter_by(buyer_id=buyer.id)
            .join(Book)
            .all()
        )
        if not cart_items:
            raise BadRequestError("Cart is empty")

        by_seller: dict = defaultdict(list)
        for item in cart_items:
            book = item.book
            if book.status != BookStatus.active:
                raise BadRequestError(f"Book '{book.title}' is no longer available")
            if book.stock < item.quantity:
                raise BadRequestError(f"Insufficient stock for '{book.title}'")
            by_seller[book.seller_id].append(item)

        created_orders = []
        try:
            for seller_id, items in by_seller.items():
                subtotal = Decimal("0")
                order = Order(
                    buyer_id=buyer.id,
                    seller_id=seller_id,
                    status=OrderStatus.placed,
                    payment_method=PaymentMethod.cod,
                    payment_status=PaymentStatus.pending,
                    shipping_line1=shipping["line1"].strip(),
                    shipping_line2=(shipping.get("line2") or "").strip() or None,
                    shipping_city=shipping["city"].strip(),
                    shipping_state=shipping["state"].strip(),
                    shipping_postal_code=shipping["postal_code"].strip(),
                    shipping_country=shipping["country"].strip(),
                    subtotal=Decimal("0"),
                )
                db.session.add(order)
                db.session.flush()

                for cart_item in items:
                    book = cart_item.book
                    line_total = book.price * cart_item.quantity
                    subtotal += line_total
                    order_item = OrderItem(
                        order_id=order.id,
                        book_id=book.id,
                        quantity=cart_item.quantity,
                        unit_price=book.price,
                        title=book.title,
                        author=book.author,
                    )
                    db.session.add(order_item)
                    book.stock -= cart_item.quantity
                    db.session.delete(cart_item)

                order.subtotal = subtotal
                created_orders.append(order)

            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        for order in created_orders:
            db.session.refresh(order)

        return created_orders
