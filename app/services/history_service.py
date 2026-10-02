from datetime import datetime, timezone

from app.extensions import db
from app.models import Book, BookStatus, BookView, User


class HistoryService:
    @staticmethod
    def record_book_view(buyer: User, book: Book) -> None:
        viewed = BookView.query.filter_by(buyer_id=buyer.id, book_id=book.id).first()
        now = datetime.now(timezone.utc)
        if viewed:
            viewed.views += 1
            viewed.viewed_at = now
        else:
            db.session.add(BookView(buyer_id=buyer.id, book_id=book.id, viewed_at=now))
        db.session.commit()

    @staticmethod
    def list_recently_viewed(buyer: User, limit: int = 50) -> list[BookView]:
        return (
            BookView.query.join(Book)
            .filter(BookView.buyer_id == buyer.id, Book.status == BookStatus.active)
            .order_by(BookView.viewed_at.desc())
            .limit(limit)
            .all()
        )
