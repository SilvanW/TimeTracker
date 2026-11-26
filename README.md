# TimeTracker

Simple time tracking application for local deployment.

## Development

### Prerequisites

- [Docker](https://www.docker.com/) (for Postgres)
- [uv](https://docs.astral.sh/uv/) (for the Python backend)
- [pnpm](https://pnpm.io/) (or npm) for the frontend

### 1. Start Postgres

```bash
docker compose up -d postgres
```

Postgres is then reachable at `localhost:5433`.

### 2. Configure the environment

The backend and the alembic migrations read the `.env` file at the project root.
For local development, `POSTGRES_URL` must point at the host-mapped port of the
docker container (adjust the password to match `POSTGRES_PASSWORD`):

```env
POSTGRES_URL=postgresql+psycopg2://postgres:your_password@localhost:5433/postgres
```

> When deploying with `docker compose`, use `postgresql+psycopg2://postgres:your_password@postgres:5432/postgres` instead.

### 3. Start the backend

```bash
cd backend
uv sync
uv run fastapi dev app/main.py
```

The API then runs at [http://localhost:8000](http://localhost:8000) (interactive docs at `/docs`).
Tables are created automatically on startup.

To apply database migrations instead (or in addition):

```bash
uv run alembic upgrade head
```

### 4. Start the frontend

The frontend talks to the backend via `NEXT_PUBLIC_API_BASE` (default:
`https://localhost/api`, the nginx deployment route). For development, create a
file `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

Then start the dev server:

```bash
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in the browser.

## MVP Features

- [x] Project Based Time
- [x] Manual time tracking with start, end and project
- [x] Calendar week overview broken down by project
- [x] Detail view filtered by project and calendar week
- [ ] In the detail view, separate hours, time, and date for better readability
- [ ] get pg schema from sql file
- [x] define expected calendar week time target for comparison
- [ ] year in overview
- [ ] overview of single day
- [ ] add where work was done (home of office)
- [x] add description per day
- [x] llm call to get short summary of week based on description
- [ ] connect to git repositories to summarize commits
