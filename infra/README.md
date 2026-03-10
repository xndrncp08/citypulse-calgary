# Infrastructure

This directory contains infrastructure configuration for deploying CityPulse Calgary.

## Local Development

Use the root `docker-compose.yml` for local development. It wires all five services together.

## Production Deployment Options

### Option A — Managed Services (recommended)

| Service       | Recommended Platform          |
|---------------|-------------------------------|
| Frontend      | Vercel or Netlify             |
| Backend       | Railway, Render, or Fly.io    |
| PostgreSQL    | Supabase, Neon, or RDS        |
| Redis         | Upstash or Railway            |
| Data Pipeline | Railway cron or Fly.io        |

### Option B — Single VPS (Docker Compose)

1. Copy the project to your server.
2. Set production environment variables in `.env`.
3. Run `docker compose -f docker-compose.yml -f infra/docker-compose.prod.yml up -d`.

## Environment Variable Checklist

### Backend
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `CORS_ORIGIN` — Frontend URL (e.g. https://citypulse.example.com)
- `NODE_ENV=production`

### Frontend
- `VITE_API_URL` — Backend URL
- `VITE_MAPBOX_TOKEN` — Mapbox access token

### Data Pipeline
- `DATABASE_URL` — Same PostgreSQL connection string
- `PIPELINE_INTERVAL_MINUTES` — Default 30
