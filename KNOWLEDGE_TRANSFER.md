# Team Knowledge Transfer & Development Rules

## Project summary
AI-powered library and research assistant built with React + Vite, FastAPI, PostgreSQL + pgvector, and LangGraph. Features: book CRUD and semantic recommendations; LLM suggestions labelled as not in the library when no catalog record matches; FAQ retrieval with one retry then customer-support fallback; SerpAPI Google Scholar research; scheduled overdue-loan email reminders; purchase-log analytics with exact metrics calculated in code and explained by an LLM.

## Team owners
### Member A — Yash / integration lead
Owns backend foundation, public API routes, configuration, authentication, canonical database models and migrations, common schemas, integration tests, and final integration.
Paths: backend/app/main.py, backend/app/api/**, backend/app/core/**, backend/app/db/**, backend/app/models/**, backend/app/schemas/**, backend/app/repositories/**, backend/tests/integration/**, backend requirements and root contracts.
### Member B — frontend developer
Owns React + Vite only: frontend/** and frontend-specific tests. Start with API mocks matching API_CONTRACTS.md until backend routes are ready. Never put LLM/SerpAPI/SMTP/database secrets in VITE_ variables.
### Member C — AI workflows and automation
Owns backend/app/ai/**, backend/app/notifications/**, backend/app/jobs/**, backend/app/analytics/**, and focused tests. Implements embedding providers, pgvector retrieval, recommendation merge/deduplication, FAQ fallback graph, SerpAPI research, reminder sending, purchase analytics. Does not edit main.py, public route files, ORM models, migrations, or shared request/response schemas without agreement.
## Contract-first rules
1. API_CONTRACTS.md is the shared source of truth. Never independently rename fields or status values.
2. Every recommendation has book_name, author, description, library_status and book_id. Statuses are in_library_available, in_library_out_of_stock, not_in_library.
3. PostgreSQL is the authority for book existence, current stock, user roles, loans, and purchase events. pgvector only locates semantically relevant books.
4. A stock-only update must not regenerate the embedding. A book's embedding status remains pending until the vector upsert succeeds.
5. FAQ retry is limited to one retry. Then return a configured support contact, never an invented one.
6. SerpAPI Google Scholar result snippets are not proof that the full paper was read.
7. Daily overdue reminder selection requires due_at <= now and returned_at IS NULL, plus duplicate-send protection.
8. Calculate exact analytics in Python/SQL; the LLM explains results and produces validated chart suggestions.
9. Loans are not purchases. Keep their records and use cases separate.
## Git workflow
- main: stable demo/release branch.
- develop: integration branch.
- Each member creates a feature branch from develop and opens a PR back to develop.
- One owner per file/path. Coordinate any cross-boundary changes in the team chat before editing.
- Before PR: update from develop, run formatting/compile/tests, check changed files, and include a concise summary and test results.
- After merge: every member pulls develop before starting their next task.
Commands:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/<short-task-name>
# edit files
git add <your-files>
git commit -m "feat: describe the change"
git push -u origin feature/<short-task-name>
```
Then open a PR targeting develop. Do not force-push shared branches or commit secrets.
## Current foundation
The first backend PR adds FastAPI health endpoints, config/session setup, initial SQLAlchemy models and PostgreSQL/pgvector migration, JSON registration/login/me endpoints, basic book list/detail/admin create/update APIs, typed AI service contracts, tests, backend setup notes, and CI checks. Embedding generation is still an explicit integration point and must not be described as implemented until Member C's service is wired and tested.
## Start here
1. Review API_CONTRACTS.md.
2. Member A reviews and tests PR #1, then merges into develop only after CI passes and local PostgreSQL/pgvector migration is tested.
3. Member B starts UI with mock API adapters matching the contract.
4. Member C builds services against backend/app/ai/contracts.py and asks Member A before schema changes.
5. Integrate incrementally: book CRUD -> embedding sync -> recommendation -> FAQ/research -> reminders -> analytics.
