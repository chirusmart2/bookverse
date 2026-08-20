# BookVerse — Book Store Marketplace

A full-stack book marketplace with a **landing page**, separate **seller** and **buyer** portals, JWT auth, catalog management, cart/checkout (Cash on Delivery), post-delivery ratings, and an **Android app** built with Capacitor. Containerized with Docker and deployed on **Render**.

**[🔗 Live Demo — Landing Page](https://bookverse-landing.onrender.com)**

The live deployment also includes the separate portals:

| Portal | URL |
|--------|-----|
| Landing | https://bookverse-landing.onrender.com |
| Seller portal | https://bookverse-seller.onrender.com |
| Buyer portal | https://bookverse-buyer.onrender.com |

> **Note:** The API runs on Render's free tier, so the first request may take ~30 seconds to wake it up. Screenshots below show the current look of each portal.

## Screenshots

*(Replace these placeholders with real screenshots of your running app — 2–3 images are enough. Upload them to the repo and update the paths.)*

| Landing Page | Seller Portal | Buyer Portal |
|:---:|:---:|:---:|
| *Add screenshot: landing* | *Add screenshot: seller* | *Add screenshot: buyer* |

## Stack

- **Backend:** Python Flask, PostgreSQL, SQLAlchemy, JWT
- **Frontends:** React + TypeScript + Vite
  - Landing, Seller portal, Buyer portal
- **Mobile:** Capacitor (Android APK via GitHub Actions)
- **DevOps:** Docker Compose, Render (`render.yaml`), GitHub Actions CI

## Quick Start

### 1. Database

```bash
docker-compose up -d
```

### 2. Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
export FLASK_APP=run:app
flask db upgrade
python scripts/seed_couriers.py
python run.py
```

API: `http://127.0.0.1:5000`

### 3. Frontends

Open the **landing page** first — it links to both portals:

```bash
# Landing (start here)
cd frontend/landing && npm install && npm run dev

# Seller portal
cd frontend/seller-portal && npm install && npm run dev

# Buyer portal
cd frontend/buyer-portal && npm install && npm run dev
```

| App | URL | Purpose |
|-----|-----|---------|
| Landing | http://localhost:5172 | Choose seller or buyer portal |
| Seller | http://localhost:5173 | Manage books & orders |
| Buyer | http://localhost:5174 | Shop, cart, COD checkout, ratings |

## User Flow

1. Visit **landing** → click Seller or Buyer portal card
2. **Seller:** Register → add books → fulfill orders (confirm → ship → deliver)
3. **Buyer:** Register → browse → cart → COD checkout → rate seller & courier when delivered

## Testing & CI

Run the test suite locally:

```bash
pip install -r requirements-dev.txt
pytest tests/
```

The `test.yml` GitHub Actions workflow runs the suite on every push — the badge above shows the latest status. An additional `build-apk.yml` workflow builds the Android APK and attaches it to a GitHub release.

## Design

Shared design system in `frontend/shared/styles/theme.css`:

- **Fraunces** display + **DM Sans** body typography
- Seller theme: teal accents
- Buyer theme: purple accents
- Sidebar navigation, split auth layouts, polished tables and cards

## API Overview

| Prefix | Role |
|--------|------|
| `/api/v1/auth` | Register, login, tokens |
| `/api/v1/seller` | Books, orders, couriers |
| `/api/v1/buyer` | Catalog, cart, checkout, ratings |

## Environment

See `.env.example` for `DATABASE_URL`, `CORS_ORIGINS`, and portal URLs.

## License

This project is licensed under the [MIT License](LICENSE).
