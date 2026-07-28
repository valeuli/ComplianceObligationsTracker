# Compliance Obligations Tracker

Full-stack application for managing company compliance obligations, due dates, documents, status transitions, and audit history.

## Features

- Dashboard with KPIs, status filters, and overdue highlighting
- Create, edit, delete, and view obligations
- Backend-controlled state transitions
- Document-gated submission
- Audit trail and optimistic locking
- Masked Tax ID display
- Spanish and English UI

## Stack

- **Backend:** FastAPI, Pydantic, SQLAlchemy, PostgreSQL, Alembic
- **Frontend:** Next.js, React, TypeScript, Tailwind
- **Testing:** Pytest, Vitest, React Testing Library

## Running locally

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d postgres
```

### 2. Start the backend

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt

cd backend
alembic upgrade head
uvicorn app.main:app --reload
```

The API will be available at:

- `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

### 3. Start the frontend

Create `frontend/.env.local`:

```env
API_URL=http://127.0.0.1:8000
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000/es` or `http://localhost:3000/en`.

## API

| Method | Endpoint |
| --- | --- |
| POST | `/api/obligations` |
| GET | `/api/obligations` |
| GET | `/api/obligations/{id}` |
| PATCH | `/api/obligations/{id}` |
| DELETE | `/api/obligations/{id}` |
| POST | `/api/obligations/{id}/transitions` |
| GET | `/health` |

## Tests

Backend:

```bash
cd backend
pytest
```
### Manual API verification

The postman/ directory contains a Postman collection and local environment for manually validating the complete API flow, including CRUD operations, state transitions, document-gated submission, optimistic locking, audit history, and Tax ID masking.

Import both files into Postman and run the collection while the backend is available at http://127.0.0.1:8000.

The Postman collection complements the automated test suites; it does not replace them.

Frontend:
```bash
cd frontend
npm test
npm run lint
npm run build
```

## Out of scope

Given more time, I would add:

- Authentication and authorization
- Real document uploads and storage
- Pagination and search
- Additional UI and accessibility improvements
- Broader automated test coverage
- CI/CD and production deployment

Architectural decisions and trade-offs are documented in [DECISIONS.md](./DECISIONS.md).