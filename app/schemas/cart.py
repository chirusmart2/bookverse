from marshmallow import Schema, ValidationError, fields, validates


class CartItemSchema(Schema):
    book_id = fields.UUID(required=True)
    quantity = fields.Integer(required=True)

    @validates("quantity")
    def validate_quantity(self, value, **kwargs):
        if value < 1:
            raise ValidationError("Quantity must be at least 1.")


class CartUpdateSchema(Schema):
    quantity = fields.Integer(required=True)

    @validates("quantity")
    def validate_quantity(self, value, **kwargs):
        if value < 1:
            raise ValidationError("Quantity must be at least 1.")
