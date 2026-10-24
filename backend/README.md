# Backend foundation

## Local setup

1. Install PostgreSQL with the pgvector extension.
2. Create a database, then run `migrations/001_initial.sql` against it.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET_KEY`, and the embedding dimension consistently with the SQL migration.
4. From this directory, install dependencies and run the API:

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs`.

## Current endpoints

- `GET /`, `GET /health`, `GET /health/db`
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- `GET /api/v1/books`, `GET /api/v1/books/{book_id}`
- `POST /api/v1/admin/books` (admin token required)
- `PATCH /api/v1/admin/books/{book_id}` (admin token required)

The book-create route currently stores the catalog row with `embedding_status=pending`; wiring the AI embedding service is an integration task. Admin account bootstrap is intentionally not exposed as public registration. Create/promote the first admin through a controlled local-only database procedure, then remove/close that procedure before production.

The SQL migration uses `vector(1536)` as a placeholder dimension. Change the migration and `EMBEDDING_DIMENSION` together before the first migration if your selected embedding model outputs a different dimension. Do not change the dimension without reindexing all vectors.
