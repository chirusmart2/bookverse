from decimal import Decimal

from marshmallow import Schema, ValidationError, fields, validates


class BookCreateSchema(Schema):
    title = fields.String(required=True)
    author = fields.String(required=True)
    isbn = fields.String(allow_none=True)
    description = fields.String(allow_none=True)
    price = fields.Decimal(required=True, as_string=True)
    stock = fields.Integer(required=True)

    @validates("title")
    def validate_title(self, value, **kwargs):
        if not value.strip() or len(value) > 255:
            raise ValidationError("Title must be 1-255 characters.")

    @validates("author")
    def validate_author(self, value, **kwargs):
        if not value.strip() or len(value) > 255:
            raise ValidationError("Author must be 1-255 characters.")

    @validates("price")
    def validate_price(self, value, **kwargs):
        if value <= 0:
            raise ValidationError("Price must be greater than 0.")

    @validates("stock")
    def validate_stock(self, value, **kwargs):
        if value < 0:
            raise ValidationError("Stock cannot be negative.")


class BookUpdateSchema(Schema):
    title = fields.String()
    author = fields.String()
    isbn = fields.String(allow_none=True)
    description = fields.String(allow_none=True)
    price = fields.Decimal(as_string=True)
    stock = fields.Integer()
    status = fields.String()

    @validates("status")
    def validate_status(self, value, **kwargs):
        if value and value not in ("active", "inactive"):
            raise ValidationError("Status must be 'active' or 'inactive'.")


class BookBulkCreateSchema(Schema):
    books = fields.List(fields.Nested(BookCreateSchema), required=True)

    @validates("books")
    def validate_books(self, value, **kwargs):
        if not value:
            raise ValidationError("At least one book is required.")
        if len(value) > 50:
            raise ValidationError("Maximum 50 books per bulk request.")
