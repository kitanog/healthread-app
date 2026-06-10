# Healthread V1

A health tracking application that helps patients track medications, symptoms, and positive effects, with intelligent side effect matching and shareable reports for healthcare providers.

## Architecture

This application follows three core principles:

1. **Palantir Foundry Ontology** - Data as first-class citizens with semantic relationships
2. **Brett Victor's Design** - Immediate feedback, direct manipulation, visible state
3. **P-Plan Methodology** - Provenance-aware, reproducible workflows

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full ontology and design documentation.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + React Query
- **Backend**: FastAPI (Python) + SQLAlchemy
- **Database**: PostgreSQL 16
- **Containerization**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Git

### Run Locally

1. **Clone and navigate to the project:**
   ```bash
   cd healthread-app
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

4. **Create an account:**
   - Navigate to http://localhost:3000/register
   - Create a new account
   - Start tracking!

### Development Mode

The Docker images are production builds (no hot reload). For live reload
during development, run the servers directly:

```bash
# Terminal 1 - Database
docker-compose up db

# Terminal 2 - Backend (runs migrations, then starts with reload)
cd backend
pip install -r requirements.txt
python prestart.py
uvicorn app.main:app --reload --port 8000

# Terminal 3 - Frontend
cd frontend
npm install
npm run dev
```

## Database Migrations (Alembic)

The schema is managed by Alembic — the app no longer creates tables at
startup. `backend/prestart.py` runs automatically when the backend container
starts: it waits for the database, applies pending migrations
(`alembic upgrade head`), and seeds reference data. Databases that predate
Alembic are detected and stamped with the baseline revision automatically,
so existing deployments adopt migrations without data loss.

When you change a model in `backend/app/db/models.py`:

```bash
cd backend
# Generate a migration from the model diff (review it before committing!)
DATABASE_URL=postgresql://... alembic revision --autogenerate -m "describe the change"

# Apply it locally
DATABASE_URL=postgresql://... alembic upgrade head
```

Commit the generated file in `backend/alembic/versions/` — it is applied to
production automatically on the next deploy.

## API Structure

The API follows the Sources (read) and Actions (write) pattern:

### Sources (Read Operations) - `/api/sources/*`
- `GET /api/sources/dashboard` - Dashboard data with stats and trends
- `GET /api/sources/medications` - User's medications
- `GET /api/sources/symptoms` - User's symptom logs
- `GET /api/sources/positive-effects` - User's positive effects
- `GET /api/sources/reports` - Generated health reports
- `GET /api/sources/side-effects` - Reference side effects data

### Actions (Write Operations) - `/api/actions/*`
- `POST /api/actions/medications` - Add medication
- `POST /api/actions/symptoms` - Log symptom
- `POST /api/actions/positive-effects` - Log positive effect
- `POST /api/actions/reports` - Generate report
- `POST /api/actions/reports/{id}/share` - Share report

## Core Features

### V1 Features (Implemented)
- ✅ User authentication (register/login)
- ✅ Medication tracking with known side effects
- ✅ Symptom logging with severity ratings
- ✅ Positive effect tracking
- ✅ Automatic side effect matching
- ✅ Health report generation
- ✅ Secure report sharing
- ✅ Dashboard with trends visualization
- ✅ AI-generated insights (rule-based)
- ✅ Provenance tracking for all actions

### Reference Data
The system includes side effects data for 13 common medications:
- Metformin, Lisinopril, Atorvastatin, Omeprazole
- Sertraline, Amlodipine, Levothyroxine, Gabapentin
- Hydrochlorothiazide, Ibuprofen, Vitamin D3
- Adderall, Prednisone

## Project Structure

```
healthread-app/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api/client.ts
│   │   ├── context/AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LogEntry.tsx
│   │   │   ├── Medications.tsx
│   │   │   └── Reports.tsx
│   │   └── types/index.ts
│   └── tailwind.config.js
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── auth.py
│       ├── schemas.py
│       ├── db/
│       │   ├── database.py
│       │   ├── models.py
│       │   └── seed.py
│       └── api/
│           ├── auth.py
│           ├── sources.py
│           └── actions.py
└── docs/
    └── ARCHITECTURE.md
```

## Environment Variables

### Backend
- `DATABASE_URL` - PostgreSQL connection string (`postgres://` URLs are normalized automatically)
- `SECRET_KEY` - JWT secret key (**required** when `ENVIRONMENT=production` — the app refuses to start with the dev default)
- `ENVIRONMENT` - `development` (default) / `production`. Production disables `/docs` and demo-user seeding
- `CORS_ORIGINS` - comma-separated allowed origins (e.g. `https://your-frontend.up.railway.app`)
- `PORT` / `HOST` - bind address (Railway injects `PORT`; set `HOST=::` for Railway private networking)
- `WEB_CONCURRENCY` - number of uvicorn workers (default 2)
- `SEED_ON_STARTUP` - set to `false` to skip reference-data seeding at boot

### Frontend
- `VITE_API_URL` - build-time API base URL (default `/api`, served same-origin through nginx)
- `BACKEND_URL` - runtime nginx proxy target for `/api` (e.g. `http://backend:8000` in compose, or your backend's Railway URL)
- `PORT` - port nginx listens on (Railway injects this)

## Cloud Deployment

### Option 1: Railway
1. Push to GitHub and connect both services (root: `backend/` and `frontend/`) to Railway; each has its own Dockerfile
2. Add a PostgreSQL service and reference its `DATABASE_URL` from the backend
3. Backend variables: `SECRET_KEY` (generate one: `openssl rand -hex 32`), `ENVIRONMENT=production`, `CORS_ORIGINS=<frontend public URL>`
4. Frontend variables: `BACKEND_URL=<backend URL>` (use the private `http://backend.railway.internal:<port>` with backend `HOST=::`, or the backend's public https URL)
5. Migrations and seeding run automatically on every backend deploy via `prestart.py`

### Option 2: Render
1. Create PostgreSQL database
2. Create web service for backend
3. Create static site for frontend

### Option 3: AWS/GCP/Azure
1. Push images to container registry
2. Deploy with ECS/Cloud Run/Container Instances
3. Use managed PostgreSQL (RDS/Cloud SQL/Azure Database)

## Security Considerations

- Passwords hashed with bcrypt
- JWT tokens for authentication
- CORS configured for frontend origin
- SQL injection prevention via SQLAlchemy ORM
- Report sharing uses secure random tokens

For production:
- Change SECRET_KEY
- Enable HTTPS
- Configure proper CORS origins
- Add rate limiting
- Implement HIPAA compliance measures

## License

MIT
