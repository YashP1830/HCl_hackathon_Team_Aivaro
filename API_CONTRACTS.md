# Shared API Contracts

These contracts are the source of truth for the three workstreams. Do not change names or enum values independently. Propose a change, agree as a team, then update this file and all affected code together.

## Roles

- `user`: may search books, get recommendations, use FAQ/research, and access their own loan records.
- `admin`: may also create/edit catalog books and view aggregate purchase analytics.

FastAPI derives the user identity and role from a validated session/token. Never trust a `user_id` or `role` in a browser request.

## Recommendation

### Request — `POST /api/v1/recommendations`

```json
{
  "query": "Suggest me books on Generative AI",
  "top_k": 5
}
```

### Response

```json
{
  "query": "Suggest me books on Generative AI",
  "recommendations": [
    {
      "book_name": "Example catalog book",
      "author": "Example Author",
      "description": "An introduction to generative AI.",
      "library_status": "in_library_available",
      "book_id": "uuid"
    },
    {
      "book_name": "Example out-of-stock book",
      "author": "Example Author",
      "description": "Covers related techniques.",
      "library_status": "in_library_out_of_stock",
      "book_id": "uuid"
    },
    {
      "book_name": "Example external suggestion",
      "author": "Example Author",
      "description": "Additional reading on the topic.",
      "library_status": "not_in_library",
      "book_id": null
    }
  ]
}
```

Every recommendation has `book_name`, `author`, `description`, `library_status`, and `book_id`. Allowed library statuses:

- `in_library_available`: catalog record exists and PostgreSQL stock is greater than zero.
- `in_library_out_of_stock`: catalog record exists and stock is zero or unavailable.
- `not_in_library`: the LLM suggests the title and no matching catalog record can be confirmed.

The LLM never decides stock or library status. PostgreSQL is the source of truth.

## Book endpoints

- `GET /api/v1/books?q=&page=1&page_size=20`
- `GET /api/v1/books/{book_id}`
- `POST /api/v1/admin/books` — admin only; create catalog record and sync embedding.
- `PATCH /api/v1/admin/books/{book_id}` — admin only; stock-only edits do not trigger re-embedding.

Book create request fields: `title`, `author`, `description`, `genre`, `publisher`, `publication_year`, `stock_quantity`.

A create response exposes `embedding_status` (`pending`, `ready`, or `failed`). Do not indicate the book is indexed until pgvector upsert succeeds. If embedding fails, keep the catalog record and permit retry.

## FAQ endpoint

### Request — `POST /api/v1/chat/faq`

```json
{ "question": "How do I borrow a book?" }
```

### Response

```json
{
  "answer": "Use the borrowing page to select an available book.",
  "status": "answered",
  "support_contact": null,
  "sources": []
}
```

Allowed statuses: `answered`, `fallback`, `error`. The workflow attempts retrieval, retries once with a rephrased query, and then provides the configured support contact if no relevant FAQ is found. Never fabricate support contact details.

## Research endpoint

### Request — `POST /api/v1/research/search`

```json
{ "topic": "retrieval augmented generation", "max_results": 5 }
```

### Response

```json
{
  "topic": "retrieval augmented generation",
  "results": [
    {
      "title": "Paper title from result",
      "authors": ["Author where available"],
      "year": 2025,
      "snippet": "Search-result snippet where available",
      "url": "https://example.org/paper",
      "doi": null
    }
  ]
}
```

Only include source metadata that the search provider actually returned. A snippet is not proof that the full paper has been read.

## Loans and reminders

- `GET /api/v1/loans/me` — only the authenticated user's loans.
- `POST /api/v1/loans/{loan_id}/return` — check ownership/admin permission before return.
- Daily reminder job finds `due_at <= now` and `returned_at IS NULL`, respects reminder cadence, and records send outcome.
- Purchase events and loans are different event types. Loan reminders never read the purchase log.

## Analytics

- `GET /api/v1/admin/analytics?start=...&end=...` — admin only.
- Calculate totals and rates in code. LLM input contains bounded/redacted metrics. Validate any generated chart data before returning it.
- Prefer a PostgreSQL purchase-events table as the durable source of truth; CSV can be an export/analysis input.

## Common errors

Use HTTP status codes consistently: 400/422 invalid input, 401 unauthenticated, 403 forbidden, 404 missing or inaccessible record, 409 conflict, 429 rate limit, and 500/503 unexpected or unavailable service. Keep error responses safe and do not expose stack traces or secrets.
