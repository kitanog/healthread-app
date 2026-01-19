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

For live reload during development:

```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Terminal 3 - Database
docker-compose up db
```

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
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key (change in production!)
- `ENVIRONMENT` - development/production

### Frontend
- `VITE_API_URL` - Backend API URL

## Cloud Deployment

### Option 1: Railway
1. Push to GitHub
2. Connect to Railway
3. Add PostgreSQL service
4. Deploy frontend and backend services

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
