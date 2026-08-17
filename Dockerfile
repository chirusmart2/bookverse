FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["sh", "-c", "mkdir -p instance && python -c \"from run import app; from app.extensions import db; app.app_context().push(); db.create_all()\" && gunicorn -w 2 -b 0.0.0.0:${PORT:-5000} run:app"]
