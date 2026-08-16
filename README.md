# BookVerse — Book Store Marketplace

A full-stack book marketplace with a **landing page**, separate **seller** and **buyer** portals, JWT auth, catalog management, cart/checkout (Cash on Delivery), and post-delivery ratings.

## Stack

- **Backend:** Python Flask, PostgreSQL, SQLAlchemy, JWT
- **Frontends:** React + TypeScript + Vite
  - Landing: `http://localhost:5172`
  - Seller portal: `http://localhost:5173`
  - Buyer portal: `http://localhost:5174`

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
