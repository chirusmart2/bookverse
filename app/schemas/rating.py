from marshmallow import Schema, ValidationError, fields, validates


class RatingSchema(Schema):
    rating = fields.Integer(required=True)
    comment = fields.String(allow_none=True)

    @validates("rating")
    def validate_rating(self, value, **kwargs):
        if value < 1 or value > 5:
            raise ValidationError("Rating must be between 1 and 5.")

    @validates("comment")
    def validate_comment(self, value, **kwargs):
        if value and len(value) > 500:
            raise ValidationError("Comment must be at most 500 characters.")
