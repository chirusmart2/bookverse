from marshmallow import Schema, ValidationError, fields, validates


class ShippingSchema(Schema):
    line1 = fields.String(required=True)
    line2 = fields.String(allow_none=True, load_default="")
    city = fields.String(required=True)
    state = fields.String(required=True)
    postal_code = fields.String(required=True)
    country = fields.String(required=True)

    @validates("line1")
    def validate_line1(self, value, **kwargs):
        if not value.strip():
            raise ValidationError("Address line 1 is required.")


class CheckoutSchema(Schema):
    shipping = fields.Nested(ShippingSchema, required=True)


class OrderStatusUpdateSchema(Schema):
    status = fields.String(required=True)
    courier_partner_id = fields.UUID(allow_none=True)

    @validates("status")
    def validate_status(self, value, **kwargs):
        allowed = ("confirmed", "shipped", "delivered", "cancelled")
        if value not in allowed:
            raise ValidationError(f"Status must be one of: {', '.join(allowed)}")
