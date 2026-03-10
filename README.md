# CityPulse Calgary

A civic analytics platform that aggregates and visualizes public datasets from the City of Calgary. Built as a production-quality full-stack application demonstrating modern engineering practices.

## Architecture

```
citypulse-calgary/
├── frontend/          # React + TypeScript + Vite + Tailwind
├── backend/           # Node.js + Express + TypeScript + Prisma
├── data-pipeline/     # Python ingestion service
├── database/          # Migrations and seeds
└── infra/             # Docker and deployment configs
```

## Tech Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Frontend      | React 18, TypeScript, Vite, Tailwind CSS        |
| Data Fetching | TanStack Query v5                               |
| Mapping       | Mapbox GL JS                                    |
| Charts        | Recharts                                        |
| Backend       | Node.js, Express, TypeScript                    |
| ORM           | Prisma                                          |
| Database      | PostgreSQL 16                                   |
| Cache         | Redis 7                                         |
| Pipeline      | Python 3.12, APScheduler, httpx, psycopg2       |

## Prerequisites

- Docker and Docker Compose
- Node.js 20+
- Python 3.12+
- A Mapbox access token ([get one free](https://mapbox.com))

## Running Locally (Docker)

1. Copy environment files:
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env.local
   ```

2. Add your Mapbox token to `frontend/.env.local`

3. Start all services:
   ```bash
   docker compose up --build
   ```

4. Open [http://localhost:5173](http://localhost:5173)

## Running Locally (Without Docker)

### 1. Start infrastructure
```bash
docker compose up postgres redis -d
```

### 2. Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Data Pipeline
```bash
cd data-pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Environment Variables

See `.env.example` and `frontend/.env.example` for all required variables.

## API Endpoints

| Method | Endpoint                        | Description                          |
|--------|---------------------------------|--------------------------------------|
| GET    | /api/traffic/incidents          | Recent traffic incidents             |
| GET    | /api/traffic/heatmap            | Incident density for heatmap         |
| GET    | /api/traffic/history            | Historical incidents by date range   |
| GET    | /api/transit/routes             | Transit routes                       |
| GET    | /api/transit/stops              | Stop locations                       |
| GET    | /api/transit/performance        | Delay and performance metrics        |
| GET    | /api/environment/weather        | Weather conditions                   |
| GET    | /api/environment/air-quality    | AQHI readings                        |
| GET    | /api/bikes/counters             | Bike counter locations               |
| GET    | /api/bikes/usage                | Historical bike usage                |
| POST   | /api/commute/predict            | Predict commute time                 |
| POST   | /api/simulation/run             | Run congestion simulation            |

## Production Deployment

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

### Backend (Railway / Render / EC2)
```bash
cd backend
npm run build
npm start
```

### Database
Run migrations against your production PostgreSQL instance:
```bash
DATABASE_URL=<prod_url> npx prisma migrate deploy
```

## Development

```bash
# Type check
cd backend && npm run typecheck
cd frontend && npm run typecheck

# Lint
npm run lint

# Format
npm run format
```
