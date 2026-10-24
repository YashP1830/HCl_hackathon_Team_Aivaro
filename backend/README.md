# Backend — AI-Powered Library & Research Assistant

## Local setup

Prerequisites: Python 3.11+, PostgreSQL, and a PostgreSQL installation that includes the pgvector extension.

From this directory:

1. Create and activate a virtual environment.
2. Install dependencies with: pip install -r requirements.txt
3. Copy .env.example to .env and set DATABASE_URL plus a strong local JWT_SECRET_KEY.
4. Create the PostgreSQL database named in DATABASE_URL.
5. Apply schema migrations with: alembic upgrade head
6. Start the API with: uvicorn app.main:app --reload --port 8000
7. Run contract tests with: pytest

The migration enables pgvector. The PostgreSQL server must already have the pgvector extension package installed. The vector columns temporarily use an unspecified SQL dimension until Member C confirms the embedding provider/model and output dimension. The embedding service must enforce one configured dimension for both document and query vectors.

## Current endpoints

- GET /health — liveness check that does not require a database connection.
- GET /health/db — verifies the database connection.
- POST /api/v1/auth/register — creates a normal user and returns a bearer token.
- POST /api/v1/auth/login — authenticates and returns a bearer token.
- GET /api/v1/auth/me — returns the authenticated user's profile.
- GET /api/v1/books?q=&page=1&page_size=20 — authenticated catalog search.
- GET /api/v1/books/{book_id} — authenticated book details.
- POST /api/v1/admin/books — admin-only create; saves the book before optional embedding sync.
- PATCH /api/v1/admin/books/{book_id} — admin-only edit; descriptive changes request re-indexing, stock-only edits do not.

Recommendation, FAQ, research, and analytics Pydantic contracts are centralized in app/schemas/__init__.py. Their public route wrappers must be connected when Member C provides the agreed service signatures. Do not claim those services are integrated until their tests pass.

## Admin provisioning

Public registration intentionally has no role field and always assigns role=user. Promote a known development account through a trusted operator/database action only, for example:

UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

Do not expose role assignment through public registration or trust a role sent by the frontend.

## Contract and data-integrity rules

- PostgreSQL owns catalog existence and current stock.
- Every recommendation requires book_name, author, description, library_status, and book_id.
- Allowed recommendation statuses are in_library_available, in_library_out_of_stock, and not_in_library.
- A book remains saved if embedding sync is unavailable or fails; status stays pending or becomes failed.
- Embedding text uses stable descriptive fields and must not include mutable stock.
- Loans and purchases are separate event types. Confirm reminder cadence and analytics terminology with the team.
- Secrets belong in .env, never in Git. VITE_ frontend variables are public and must not contain credentials.
