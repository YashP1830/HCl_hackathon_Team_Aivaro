# AI-Powered Library & Research Assistant

> **Project documentation:** End-to-end product overview, architecture, data model, AI workflows, API contracts, setup, testing, and deployment guidance.
>
> **Important:** This README describes the intended architecture based on the project design discussed so far. Items such as exact database credentials, embedding model, email provider, support contact, package versions, and final API route names must be aligned with the actual repository before deployment. Example values and sample records are illustrative.

> **Team development docs:** [Knowledge transfer and ownership rules](KNOWLEDGE_TRANSFER.md) · [Shared API contracts](API_CONTRACTS.md) · [Backend setup](backend/README.md).

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement and Goals](#2-problem-statement-and-goals)
3. [Core Features](#3-core-features)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Main User Journeys](#6-main-user-journeys)
7. [Semantic Book Recommendation Design](#7-semantic-book-recommendation-design)
8. [LangGraph Workflows](#8-langgraph-workflows)
9. [Data Model](#9-data-model)
10. [API Design](#10-api-design)
11. [Book Ingestion and pgvector Synchronization](#11-book-ingestion-and-pgvector-synchronization)
12. [Email Notification Workflow](#12-email-notification-workflow)
13. [Purchase Log and LLM Analytics](#13-purchase-log-and-llm-analytics)
14. [Configuration and Environment Variables](#14-configuration-and-environment-variables)
15. [Local Development Setup](#15-local-development-setup)
16. [Running and Operating the Application](#16-running-and-operating-the-application)
17. [Security and Reliability](#17-security-and-reliability)
18. [Testing and Evaluation](#18-testing-and-evaluation)
19. [Deployment Guide](#19-deployment-guide)
20. [Known Limitations and Design Decisions](#20-known-limitations-and-design-decisions)
21. [Suggested Development Roadmap](#21-suggested-development-roadmap)
22. [Interview Explanation](#22-interview-explanation)
23. [Glossary](#23-glossary)

---

## 1. Project Overview

The **AI-Powered Library & Research Assistant** is a library management and discovery application that combines traditional catalog and loan management with a small set of practical AI features.

Users can search for books using natural language, receive recommendations from the books in the library and from an LLM, ask frequently asked questions, and discover research papers on a topic. The system clearly distinguishes books that are currently available, books that belong to the catalog but are out of stock, and books that the LLM suggests but the library does not contain.

Administrators can maintain book records. When a book is added or its descriptive metadata changes, the backend generates an embedding and stores it in **PostgreSQL with pgvector** so the book can be discovered through semantic search. A scheduled process emails users when a borrowed book is past its due date and has not been returned. A purchase-event log is used to calculate business metrics, which an LLM then explains in readable language and can help present as chart data.

### One-sentence summary

A React and FastAPI library application using PostgreSQL/pgvector and LangGraph to support semantic book discovery, FAQ assistance, scholarly search, due-date email reminders, and purchase analytics.

## 2. Problem Statement and Goals

### Problems addressed

- Searching a catalog by exact title or keyword can miss books whose descriptions are semantically relevant.
- Users may want recommendations beyond the current catalog, but must not confuse external suggestions with books the library owns.
- Repeated questions can be answered from approved FAQs, while unanswered questions need a clear customer-support fallback.
- Finding research papers manually can take time; a scholarly search workflow can collect useful paper metadata and links.
- Users may forget due dates, so the system needs a reliable way to send reminders for unreturned books.
- Administrators need understandable purchase trends derived from recorded events rather than unverified numbers invented by an LLM.

### Design goals

1. **Keep the core architecture simple.** One frontend, one FastAPI backend, PostgreSQL with pgvector, and a small LangGraph workflow.
2. **Keep PostgreSQL authoritative.** Book existence, metadata, stock, loans, and purchase events must not be inferred from embeddings or LLM output.
3. **Use AI where it adds value.** Embeddings help match meaning; an LLM suggests external reading and explains analytics; deterministic code handles counts, statuses, and business rules.
4. **Make provenance visible.** Every book suggestion is labelled by library status. Research results include source links where available.
5. **Bound AI behavior.** FAQ fallback retries once, and research calls should have time and usage limits.
6. **Make failures observable.** Embedding failures, email failures, and analytics generation failures should be recorded and retryable.

## 3. Core Features

### 3.1 Book catalog management

- Admin creates and edits book metadata.
- Catalog records contain title, author, description, genre/category, publisher, publication year, and current availability/stock fields as applicable.
- An optional e-book record can refer to a private file stored separately from relational metadata.
- Descriptive changes trigger embedding regeneration; stock-only changes do not.

### 3.2 Hybrid-source semantic recommendations

A natural-language query such as **“Suggest me books on Generative AI”** is handled using two sources:

1. **Library source:** embed the query, search book embeddings in pgvector, and fetch current catalog and stock fields from PostgreSQL.
2. **LLM source:** ask the LLM for additional relevant book recommendations that might not exist in the catalog.

The results are merged, deduplicated, and labelled as one of:

- `in_library_available`
- `in_library_out_of_stock`
- `not_in_library`

Every result must include the same three content fields: `book_name`, `author`, and `description`. `library_status` is additional metadata used to explain whether the result is held by the library and whether it is available.

### 3.3 FAQ chatbot

- Retrieves relevant approved FAQ records using semantic similarity.
- Produces an answer grounded in the retrieved FAQ content when the match is sufficiently relevant.
- If the first retrieval is weak, reformulates the query and retries once.
- If the retry also fails, transparently tells the user no relevant FAQ was found and provides the configured customer-support contact.

### 3.4 Research-paper search

- Routes scholarly search requests to a LangGraph research node.
- Uses SerpAPI to query Google Scholar results for the requested topic.
- Returns available result metadata, such as paper title, authors, publication year, snippet, and link.
- Does not claim that a full paper was read unless its full text was actually retrieved and processed.

### 3.5 Due-date email notifications

- A scheduled backend task finds loan records where the due date has passed and the book is still unreturned.
- It sends email to the user attached to the loan record.
- It records reminder delivery state to avoid repeated messages on every scheduler run.
- Returned books are excluded from future reminder sends.

### 3.6 Admin analytics

- The application records successful purchase events in a structured log.
- Analytics code parses the selected period and calculates exact metrics, such as purchase count, popular titles, revenue where relevant, and changes over time.
- The LLM receives bounded, preferably aggregated data and creates a narrative explaining the metrics. It can also propose chart data, which must be validated before display.
- Access to global purchase analytics is restricted to authorized administrators.

> **Terminology reminder:** purchases and loans are different events. The purchase log powers purchase analytics; the loans table powers overdue reminders. If the application does not actually sell books, log borrowing/checkout events under accurate names rather than calling them purchases.

## 4. Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React + Vite | Catalog, search UI, recommendation cards, FAQ chat, research results, loan views, admin dashboard |
| Backend API | FastAPI | Authentication, authorization, request validation, book/loan APIs, logging, and workflow entry points |
| AI orchestration | LangGraph | Routes work to recommendation, FAQ, or research nodes; carries state and bounded retry information |
| Relational data | PostgreSQL | Users, books, e-books metadata, loans, FAQs, purchase events/log metadata, and application records |
| Vector search | pgvector extension | Embeddings for book descriptions and FAQ questions/answers |
| Embeddings | Configured embedding model | Converts descriptive text and user queries into vectors of the same dimension |
| LLM | Configured model provider | External book suggestions, FAQ phrasing where appropriate, and analytics narrative/chart proposal |
| Research search | SerpAPI / Google Scholar results | Finds scholarly search results and available metadata/links |
| Email | Configured SMTP or email provider | Sends overdue reminders and records outcomes |
| Scheduler | Simple scheduled task/cron initially | Runs due-date checks at the selected interval |
| Analytics input | Structured purchase log (CSV/JSONL) or database event table | Provides the events from which metrics are calculated |

Exact providers and package versions should be set in the project configuration. Avoid adding extra services (for example, a separate vector database, Redis, or microservices) unless a real requirement justifies them: pgvector already places vector search alongside PostgreSQL data.

## 5. System Architecture

### 5.1 High-level component diagram

```mermaid
flowchart TD
    ACTOR["User / Admin"] --> UI["React + Vite"]
    UI --> API["FastAPI backend"]
    API --> AUTH["Authentication + role checks"]
    AUTH --> DB[("PostgreSQL + pgvector")]
    API --> GRAPH["LangGraph workflows"]
    GRAPH --> DB
    GRAPH --> SERP["SerpAPI / Google Scholar"]
    SCHED["Scheduled due-date task"] --> DB
    SCHED --> MAIL["Email provider"]
    API --> EVENTS["Purchase event log"]
    EVENTS --> METRICS["Deterministic metric calculation"]
    METRICS --> LLM["LLM analytics explanation"]
    LLM --> DASH["Admin dashboard / charts"]
    DASH --> UI
```

### 5.2 Component responsibilities

**React + Vite frontend**

- Collects user queries and displays results.
- Sends requests to FastAPI over HTTPS.
- Displays library status separately from book descriptions.
- Shows research links, FAQ answers, loan due dates, and admin-only analytics.
- Does not decide whether a user is an admin or whether a book is in stock; it displays server-authoritative information.

**FastAPI backend**

- Validates input using request models (for example, Pydantic models).
- Verifies user identity and permissions.
- Creates and updates catalog records.
- Coordinates embedding creation and synchronization with pgvector.
- Exposes the recommendation, FAQ, research, loan, and admin analytics APIs.
- Records purchase events after a purchase is confirmed.
- Exposes stable errors and request identifiers for debugging.

**PostgreSQL + pgvector**

- Stores authoritative book metadata and stock.
- Stores users and loan records.
- Stores FAQ content and vectors where applicable.
- Stores book embeddings linked to book IDs.
- Can store purchase events in a table even if the project also exports a CSV log.

**LangGraph AI workflow**

- Routes a request to the right workflow.
- Carries query, retrieved candidates, evidence, result status, and bounded retry count.
- Handles the FAQ retry and customer-support fallback.
- Runs the research search node when the request is about scholarly papers.
- Supports the recommendation flow that combines catalog matches and LLM-only suggestions.

**Scheduled notification task**

- Runs on a defined schedule (for example, once daily).
- Queries overdue, unreturned loans.
- Sends email and records success/failure.

**Analytics pipeline**

- Parses log records and calculates exact numbers in code.
- Redacts unnecessary direct personal information before LLM use.
- Uses the LLM to explain precomputed data and optionally produce a bounded chart specification.

### 5.3 Request flow overview

1. The user submits a query in the frontend.
2. FastAPI authenticates the user and checks access.
3. FastAPI routes the query into the appropriate LangGraph workflow or application service.
4. The workflow searches PostgreSQL/pgvector and/or calls the SerpAPI research node.
5. Results are checked, labelled, and formatted into a structured response.
6. The frontend renders the response, including library status and source links where available.

## 6. Main User Journeys

### 6.1 Admin adds a book

1. Admin submits descriptive book fields and stock data.
2. FastAPI validates the request and stores the book row.
3. The backend constructs searchable text from stable descriptive fields.
4. An embedding model generates the vector.
5. The vector is upserted into the book embedding table with the book ID.
6. The system marks indexing as ready only after the embedding has been stored successfully.
7. If embedding/indexing fails, the row is retained, its indexing status is marked failed, and a retry can be triggered.

### 6.2 User asks for recommendations

1. The query is embedded and searched against book vectors in pgvector.
2. Matched IDs are joined with the current book rows and stock values.
3. The LLM is asked for additional relevant books that may be outside the catalog, using a strict structured schema.
4. LLM suggestions are compared with the real catalog by normalized title/author, with sensible tolerance for punctuation/capitalization differences.
5. Duplicate results are merged.
6. Every item is returned with `book_name`, `author`, `description`, and `library_status`.
7. Available library books are shown as available, catalog books with zero stock are marked out of stock, and unmatched LLM suggestions are marked not in the library.

### 6.3 User asks an FAQ question

1. Retrieve the best FAQ candidates from pgvector.
2. Assess whether the retrieved content is sufficiently relevant.
3. If yes, answer from the approved content.
4. If no, reformulate and retry once.
5. If the second retrieval is still insufficient, show a support fallback using the configured contact details.

### 6.4 User asks for research papers

1. LangGraph routes the request to the research node.
2. SerpAPI searches Google Scholar results using the topic.
3. The node normalizes and deduplicates search results.
4. The API returns result metadata and links, clearly indicating which fields are available.
5. If useful results are not available, the system returns an honest no-results message rather than fabricating references.

### 6.5 User misses a book due date

1. The scheduler queries loans due by the current time that have no return timestamp.
2. It checks notification state to avoid an unwanted duplicate email.
3. It sends the reminder.
4. It persists the send result/time.
5. After the book is returned, `returned_at` is populated and the loan is excluded from overdue reminder selection.

### 6.6 Admin requests analytics

1. Admin selects a date/time range.
2. Backend loads purchase log records for the selected period.
3. Python or SQL calculates deterministic totals and trends.
4. Unnecessary personal identifiers are removed from the LLM input.
5. The LLM generates a natural-language explanation and optionally structured chart data.
6. The API validates the chart schema and returns metrics, narrative, and chart-ready series to the frontend.

## 7. Semantic Book Recommendation Design

### 7.1 Two recommendation sources

**Source A — catalog results**

- Embed the user query using the same embedding model used for the book index.
- Search the pgvector index by cosine similarity or the distance function configured for the index.
- Retrieve the full book records from PostgreSQL using the result IDs.
- Read current stock/status from PostgreSQL rather than relying on a vector payload that may contain stale availability.

**Source B — LLM-only suggestions**

- Ask the LLM for relevant titles that may provide additional reading options.
- Require structured output for each item.
- Match each suggestion back to the catalog before labelling it as external.
- If a matching catalog record exists, use the catalog's details and actual stock; do not allow the LLM to override availability.
- If no matching catalog record exists, label the item `not_in_library`.

### 7.2 Three required content fields

Every book recommendation, regardless of source, must contain these fields:

| Field | Type | Description |
|---|---|---|
| `book_name` | string | Book title |
| `author` | string | Author name(s); use a safe unknown marker if the author cannot be verified |
| `description` | string | Short description of the book and why it matches the user's query |

Each result also has a status field:

| `library_status` | Meaning | Source of truth |
|---|---|---|
| `in_library_available` | Catalog record exists and stock is greater than zero | PostgreSQL book row |
| `in_library_out_of_stock` | Catalog record exists but stock is zero/unavailable | PostgreSQL book row |
| `not_in_library` | Suggested by the LLM but no matching catalog record is confirmed | Catalog comparison |

These statuses should not be inferred solely from the LLM's claims.

### 7.3 Recommendation flow

```mermaid
flowchart TD
    Q["User query"] --> VECQ["Generate query embedding"]
    VECQ --> VSEARCH["pgvector semantic search"]
    VSEARCH --> DBMATCH["Fetch catalog matches + current stock"]
    Q --> LLM["LLM suggests additional books"]
    LLM --> NORMAL["Normalize title/author fields"]
    DBMATCH --> MERGE["Merge and deduplicate candidates"]
    NORMAL --> MERGE
    MERGE --> CHECK["Match against real catalog"]
    CHECK --> LABEL["Assign library status"]
    LABEL --> RESPONSE["Return 3 fields + status for every item"]
```

### 7.4 Example response contract

```json
{
  "query": "Suggest me books on Generative AI",
  "recommendations": [
    {
      "book_name": "Example title held by the library",
      "author": "Example Author",
      "description": "Introduces the foundations of generative AI.",
      "library_status": "in_library_available"
    },
    {
      "book_name": "Example title currently unavailable",
      "author": "Example Author",
      "description": "Covers the design and use of generative models.",
      "library_status": "in_library_out_of_stock"
    },
    {
      "book_name": "Example external suggestion",
      "author": "Example Author",
      "description": "Provides further reading on generative AI applications.",
      "library_status": "not_in_library"
    }
  ]
}
```

All titles and authors above are illustrative placeholders, not assertions about actual books in the catalog.

### 7.5 Ranking and fallback rules

- Rank catalog candidates by semantic relevance, optionally applying a reranker if needed.
- Prioritize available catalog items in the UI, but keep relevant out-of-stock items visible in their own group.
- Treat LLM-only results as suggestions—not guaranteed bibliographic truth. If possible, verify titles/authors with a trusted catalog or scholarly/book metadata source before presenting them as factual.
- Normalize titles and authors before deduplication. Minor capitalization or punctuation variations should not cause a duplicate to appear in two groups.
- A vector similarity score is a relevance signal, not a confidence guarantee. Tune thresholds using representative queries.
- If no result from either source is relevant, return an empty result with a clear explanation.

## 8. LangGraph Workflows

Keep LangGraph small and readable. A single graph may route requests to one of the workflow paths below; separate graphs can also be used if that makes the code clearer. Exact state definitions depend on the repository implementation.

### 8.1 Suggested router state

Potential state fields:

- `query`: original user request.
- `intent`: `recommend_books`, `faq`, or `research_search`.
- `user_id`: derived from validated auth context, not trusted from arbitrary user input.
- `catalog_matches`: real catalog records returned from the database.
- `llm_suggestions`: parsed structured suggestions.
- `recommendations`: merged and labelled output.
- `faq_candidates`: retrieved FAQ entries and scores.
- `retry_count`: FAQ retry counter.
- `research_results`: normalized SerpAPI result items.
- `error` / `stop_reason`: safe diagnostic result.

Do not put permissions solely in an LLM prompt. The backend and retrieval code must enforce them.

### 8.2 FAQ fallback workflow

```mermaid
flowchart TD
    START["FAQ question"] --> SEARCH["Retrieve FAQ vectors"]
    SEARCH --> GRADE{"Above relevance threshold?"}
    GRADE -->|Yes| ANSWER["Answer from approved FAQ"]
    GRADE -->|No and retry_count = 0| REWRITE["Rewrite query; set retry_count = 1"]
    REWRITE --> SEARCH
    GRADE -->|No after retry| SUPPORT["Return configured support contact"]
```

Key rule: the loop is bounded to one retry. The final fallback should include a support email/phone/help URL from configuration, not invented details.

### 8.3 Research search workflow

```mermaid
flowchart TD
    START["Research question"] --> SEARCH["SerpAPI Google Scholar search"]
    SEARCH --> NORMALIZE["Normalize available metadata"]
    NORMALIZE --> DEDUP["Deduplicate results"]
    DEDUP --> CHECK{"Useful results?"}
    CHECK -->|Yes| RETURN["Return citations/links and metadata"]
    CHECK -->|No| EMPTY["Return honest no-results response"]
```

Research output should preserve the source link, title, available author/year fields, snippet, and retrieval timestamp where useful. If a source returns only an abstract or snippet, label the summary accordingly.

### 8.4 Error and budget handling

- Bound the number of search calls, model calls, retries, and maximum run duration.
- Treat external search results as untrusted text, not instructions to execute.
- If a provider fails, return a safe error or fallback path and log a request/run ID.
- Do not let the LLM change book stock, loan-return status, user roles, or purchase records.

## 9. Data Model

The following is a logical starting point. Adapt field names and constraints to the existing code/database. It is not evidence that these tables already exist.

### 9.1 Core entities

| Table | Example fields | Notes |
|---|---|---|
| `users` | `id`, `name`, `email`, `password_hash`/auth subject, `role`, `created_at` | `email` should be unique. Never store a plaintext password. |
| `books` | `id`, `title`, `author`, `description`, `genre`, `publisher`, `publication_year`, `stock_quantity`, `availability_status`, timestamps | Source of truth for catalog existence and stock. |
| `ebooks` | `id`, `book_id`, `storage_key`, `file_name`, `file_type`, `file_size`, timestamps | Optional file metadata. Keep the file itself outside the relational row, in private storage. |
| `book_embeddings` | `book_id`, `embedding`, `embedded_text`, `embedding_model`, `updated_at` | One current embedding per book is sufficient initially. `book_id` should reference `books.id`. |
| `faqs` | `id`, `question`, `answer`, `category`, timestamps | Approved content for the FAQ chatbot. FAQ vector representation can be held in an analogous table. |
| `faq_embeddings` | `faq_id`, `embedding`, `embedded_text`, `embedding_model`, `updated_at` | Lets FAQ semantic search run within pgvector. |
| `loans` | `id`, `user_id`, `book_id`, `borrowed_at`, `due_at`, `returned_at`, `reminder_sent_at` | Reminder eligibility is based on due date and return state. |
| `purchase_events` | `id`/`purchase_id`, `user_id`, `book_id`, `quantity`, `amount`, `currency`, `purchased_at` | Authoritative structured purchase events; optionally export to a log file. |
| `notification_logs` (optional) | `id`, `loan_id`, `notification_type`, `sent_at`, `status`, `provider_message_id`, `error_code` | Use if multiple reminder types or attempts need a history. |

### 9.2 Relationships

```mermaid
erDiagram
    USERS ||--o{ LOANS : borrows
    BOOKS ||--o{ LOANS : included_in
    BOOKS ||--o| BOOK_EMBEDDINGS : indexed_by
    BOOKS ||--o{ EBOOKS : may_have
    USERS ||--o{ PURCHASE_EVENTS : makes
    BOOKS ||--o{ PURCHASE_EVENTS : purchased_as
    LOANS ||--o{ NOTIFICATION_LOGS : can_trigger
```

### 9.3 Indexes and constraints worth considering

- Unique index on `users.email`.
- Index on `loans(due_at)` and an index/partial index for open loans (`returned_at IS NULL`).
- Index on `purchase_events(purchased_at)` and on `purchase_events(book_id, purchased_at)` for common analytics queries.
- Primary/foreign keys for `book_embeddings.book_id`, `ebooks.book_id`, `loans.user_id`, `loans.book_id`, and purchase references.
- A pgvector index using the distance operator and index type appropriate to the selected metric and dataset size. For a small dataset, exact search may be enough initially.
- Unique/idempotency key for purchase events if event replay could create duplicates.

### 9.4 pgvector schema illustration

Example only: choose the dimension to match the embedding model. The dimension below is a placeholder and must not be copied blindly.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Replace 1536 with the exact output dimension of the chosen model.
CREATE TABLE book_embeddings (
    book_id UUID PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE,
    embedded_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    embedding_model TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The query embedding and stored book embeddings must use the same embedding model/version and vector dimension. If the embedding model changes, plan a re-embedding and index migration rather than mixing incompatible vectors.

## 10. API Design

Routes below are proposed contracts for documentation. Replace names with the actual routes in the repository. Prefixing them with `/api/v1` provides a place to evolve the API later.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public, rate-limited | Authenticate and establish a session. |
| `GET` | `/api/v1/users/me` | User | Return the signed-in user's safe profile fields. |
| `GET` | `/api/v1/books?query=...` | According to catalog policy | Search/filter catalog metadata. |
| `GET` | `/api/v1/books/{book_id}` | According to catalog policy | Read one book and current availability. |
| `POST` | `/api/v1/admin/books` | Admin | Create a book and trigger embedding creation. |
| `PATCH` | `/api/v1/admin/books/{book_id}` | Admin | Update metadata or stock. Re-embed only when descriptive text changes. |
| `POST` | `/api/v1/recommendations` | User | Run vector search + LLM suggestions and return structured recommendations. |
| `POST` | `/api/v1/chat/faq` | User | Run the bounded FAQ retrieval/retry flow. |
| `POST` | `/api/v1/research/search` | User | Search Google Scholar results through SerpAPI. |
| `GET` | `/api/v1/loans/me` | User | List the signed-in user's current/past loans. |
| `POST` | `/api/v1/loans/{loan_id}/return` | Authorized user/admin | Record a return only when policy permits. |
| `GET` | `/api/v1/admin/analytics?start=...&end=...` | Admin | Calculate metrics and produce an LLM narrative/chart data. |

### 10.1 Recommendation request

```json
{
  "query": "Suggest me books on Generative AI",
  "limit": 10
}
```

### 10.2 Recommendation response

```json
{
  "query": "Suggest me books on Generative AI",
  "recommendations": [
    {
      "book_name": "Example catalog book",
      "author": "Example Author",
      "description": "Relevant introduction to generative AI.",
      "library_status": "in_library_available"
    }
  ]
}
```

The example title is a placeholder. The API should validate the schema and allowed status values before sending the response.

### 10.3 FAQ request/response concept

Request:

```json
{
  "question": "How long can I keep a borrowed book?"
}
```

Response when found:

```json
{
  "status": "answered",
  "answer": "A grounded answer based on the approved FAQ.",
  "sources": [
    {"faq_id": "faq-id", "question": "Relevant FAQ question"}
  ]
}
```

Fallback response when not found after one retry:

```json
{
  "status": "support_fallback",
  "answer": "I could not find a reliable answer in the FAQs.",
  "support": {
    "email": "configured-support-email"
  }
}
```

`configured-support-email` is a placeholder. Use the real configured contact in a working environment.

### 10.4 Research request/response concept

```json
{
  "topic": "retrieval augmented generation for scientific literature"
}
```

```json
{
  "status": "success",
  "results": [
    {
      "title": "Result title from search provider",
      "authors": ["Author where available"],
      "year": 2025,
      "snippet": "Search-result snippet, if provided",
      "url": "https://example.org/paper"
    }
  ]
}
```

Search-result fields can be absent. Validate and normalize provider output rather than assuming every result has all metadata.

### 10.5 HTTP status conventions

- `200 OK`: successful read/query.
- `201 Created`: a resource was created synchronously.
- `202 Accepted`: a long operation was accepted for processing.
- `400 Bad Request` or `422 Unprocessable Entity`: invalid input.
- `401 Unauthorized`: missing/invalid identity.
- `403 Forbidden`: authenticated but not allowed.
- `404 Not Found`: resource does not exist or policy requires hiding its existence.
- `409 Conflict`: conflicting state, such as a duplicate unique record.
- `429 Too Many Requests`: rate limit reached.
- `5xx`: unexpected server/provider failure.

Use a consistent error body containing a stable code, a safe message, and a request ID. Never return secrets, stack traces, raw provider credentials, or database connection strings.

## 11. Book Ingestion and pgvector Synchronization

### 11.1 What goes into the embedding

Construct a single searchable text string from stable book attributes, for example:

`Title: {title}. Author: {author}. Genre: {genre}. Description: {description}. Publisher: {publisher}. Published: {publication_year}.`

The exact fields depend on the catalog. Keep descriptive information in the vector text. **Do not include stock quantity in the embedded text**, because stock can change frequently and does not change the book's semantic subject.

### 11.2 Create/update flow

```mermaid
flowchart TD
    ADMIN["Admin submits book"] --> VALID["Validate request"]
    VALID --> SAVE["Save book row"]
    SAVE --> TEXT["Build searchable descriptive text"]
    TEXT --> EMBED["Generate embedding"]
    EMBED --> UPSERT["Upsert vector by book_id"]
    UPSERT --> READY["Mark embedding ready"]
    EMBED -->|"Failure"| FAILED["Mark failed and allow retry"]
```

### 11.3 Consistency rules

- Store the book row first so it has a stable primary key.
- Link the embedding row to that `book_id` using a foreign key and an upsert.
- If the vector write fails, keep the catalog record but set indexing status to `failed` or `pending`. The admin should be able to retry.
- When the description/title/author/genre used in the embedding changes, generate a new embedding and update the existing vector row.
- When only stock changes, update stock and availability in PostgreSQL without calling the embedding model.
- Deleting a book should follow a defined policy: remove/deactivate the catalog record and remove its vector only when the deletion is authorized and intended.
- Use a checksum or content/version field if you need to detect whether embedding text really changed.
- Do not run a full-corpus re-embedding job whenever a new book arrives. Only process the changed book.

### 11.4 Race conditions and consistency

An HTTP database transaction cannot automatically make a remote embedding API call and vector update fully atomic. For a simple first version, record the book and a `embedding_status`, attempt embedding, and update the status after success. On failures, retry idempotently. If the system later needs stronger reliability, use a small background job/outbox pattern—but add that only if operational needs justify it.

## 12. Email Notification Workflow

### 12.1 Eligibility rule

A loan should qualify for an overdue reminder when:

- `due_at <= current time`, and
- `returned_at IS NULL`, and
- the reminder policy says an email is due (for example, no reminder has been sent for that due date, or the next daily reminder interval has elapsed).

### 12.2 Scheduler flow

```mermaid
flowchart TD
    SCHED["Daily scheduled task"] --> QUERY["Find due and unreturned loans"]
    QUERY --> DEDUPE["Check reminder state"]
    DEDUPE --> SEND["Send email"]
    SEND --> SAVE["Save notification outcome"]
    RETURN["Book returned"] --> MARK["Set returned_at"]
    MARK --> QUERY
```

### 12.3 Email content

A reminder should include:

- User greeting using the stored display name where available.
- Book title.
- Due date, formatted in the configured time zone.
- A clear request to return the book or contact the library if there is a problem.
- The real library support contact configured for the environment.

Keep the email short and do not disclose other loans or personal data to another recipient.

### 12.4 Duplicate prevention and failures

- Use `reminder_sent_at` for a single reminder policy or a separate `notification_logs` table for repeated reminders and delivery attempts.
- Record outcomes such as `sent`, `failed`, and an error code without putting credentials or private provider responses in logs.
- A retry should not create duplicate notifications if the provider already accepted the message. Use idempotency support if the provider offers it, and define how uncertain send outcomes are handled.
- A returned book should not receive new overdue reminders.

## 13. Purchase Log and LLM Analytics

### 13.1 Event structure

Keep the log structured, with stable identifiers and timestamps. Example CSV header:

```csv
purchase_id,user_id,book_id,book_title,purchased_at,quantity,amount,currency
```

Illustrative example row:

```csv
P-1001,U-021,B-104,Generative AI Basics,2026-10-24T09:30:00+05:30,1,499.00,INR
```

Never treat the sample row as a real transaction. Only record confirmed purchase events. If a payment can be retried, use a unique purchase/transaction identifier so retries do not double-count it.

### 13.2 Analytics pipeline

```mermaid
flowchart TD
    EVENT["Confirmed purchase event"] --> LOG["Structured log or purchase table"]
    LOG --> LOAD["Load selected time range"]
    LOAD --> CALC["Calculate metrics in code"]
    CALC --> REDACT["Remove unnecessary personal identifiers"]
    REDACT --> LLM["LLM summarizes supplied metrics"]
    CALC --> CHART["Create validated chart series"]
    LLM --> REPORT["Analytics report"]
    CHART --> REPORT
    REPORT --> DASH["Admin dashboard"]
```

### 13.3 Useful metrics

Depending on available data, the dashboard may include:

- Total purchase events over the selected interval.
- Total quantity of books purchased.
- Revenue and currency, if recorded accurately.
- Most purchased books by count or quantity.
- Purchases by day/week/month.
- Change compared with a previous period of equal length.
- Trends or anomalies worth investigating.

If the project does not take payments, do not display revenue; use purchase counts or borrowing/checkout metrics appropriate to the actual business process.

### 13.4 Why the LLM should not do the arithmetic

Python/SQL should calculate exact totals, counts, percentages, and time groupings. The LLM should receive the results and explain them, for example: “Book A had the highest number of purchases in this period.” This separation makes the report reproducible and reduces arithmetic errors.

### 13.5 Chart contract

A simple chart specification may contain:

```json
{
  "title": "Purchases by month",
  "chart_type": "bar",
  "x_key": "month",
  "series": [
    {"data_key": "purchases", "label": "Purchases"}
  ],
  "data": [
    {"month": "2026-08", "purchases": 12},
    {"month": "2026-09", "purchases": 18}
  ]
}
```

This is an illustrative contract. The exact chart format should match the frontend chart library. Validate permitted chart types, key names, point counts, and numeric values. Do not render arbitrary HTML or executable code returned by the LLM.

### 13.6 File log versus database table

A CSV/JSONL log is easy to inspect and suitable for a small single-process project. However, parallel writes, file rotation, corrupted rows, and concurrent analytics reads become harder as usage grows. A more reliable evolution is to record purchase events in PostgreSQL and export a CSV whenever a file-based analysis snapshot is needed. If keeping the file as the initial source, define locking/atomic append behavior, a backup policy, and validation for malformed rows.

## 14. Configuration and Environment Variables

Create a local `.env` from `.env.example`. Do not commit `.env` to Git. These are names to consider, not a declaration that each variable already exists in the code.

```dotenv
# Frontend
VITE_API_BASE_URL=http://localhost:8000/api/v1

# API
APP_ENV=development
API_PREFIX=/api/v1
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/library_assistant
CORS_ORIGINS=http://localhost:5173

# Authentication (use secrets; do not use these sample values in production)
JWT_SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Embeddings / LLM - adapt names to the model provider used by the code
LLM_API_KEY=
LLM_MODEL=
EMBEDDING_MODEL=
EMBEDDING_DIMENSION=

# Research search
SERPAPI_API_KEY=

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SUPPORT_EMAIL=

# Notifications
OVERDUE_CHECK_CRON=0 9 * * *
APP_TIMEZONE=Asia/Kolkata

# Analytics
PURCHASE_LOG_PATH=./data/purchase_logs.csv
```

Security notes:

- Use a supported secret manager or deployment environment for production secrets.
- Keep all `VITE_` variables non-sensitive; they are exposed to frontend code. Never place an LLM or SerpAPI secret in a frontend variable.
- Validate environment configuration at startup and fail clearly if a required secret is missing.
- Use a separate database user with the minimum required permissions in production.
- The scheduler's exact configuration depends on how the application is deployed; a cron expression is only an example.

## 15. Local Development Setup

Because the exact repository layout and package versions are not confirmed in this README, the commands below are a generic setup guide. Adapt them to the actual project files and dependency manager.

### 15.1 Prerequisites

- Git
- Node.js and npm for React/Vite
- Python version supported by the backend's dependency files
- PostgreSQL with the pgvector extension installed/enabled
- API credentials for the configured LLM and SerpAPI providers
- SMTP/email provider credentials for testing reminders (a local mail-capture tool can be used for development)

### 15.2 Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

Replace the placeholders with the real repository and directory names.

### 15.3 Configure PostgreSQL and pgvector

Create a development database and enable the extension:

```sql
CREATE DATABASE library_assistant;
\c library_assistant
CREATE EXTENSION IF NOT EXISTS vector;
```

Then run the actual schema migrations from your repository. Do not substitute the illustrative schema in this README for the real migrations without reviewing it.

### 15.4 Backend setup (generic Python)

```bash
cd backend
python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`, apply the database migrations, and start FastAPI using the command supported by the repository. A common development command is:

```bash
uvicorn app.main:app --reload --port 8000
```

This assumes `app/main.py` exposes an ASGI application named `app`; adjust the module path to match the actual project.

FastAPI commonly exposes interactive API documentation at `/docs` when enabled.

### 15.5 Frontend setup (generic React + Vite)

In a separate terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the development URL printed by Vite (often `http://localhost:5173`). Ensure the API base URL and FastAPI CORS settings match.

### 15.6 Start the overdue reminder scheduler

Run the scheduler using the project's chosen mechanism. For local development, you may invoke a one-shot reminder function manually before enabling a recurring schedule. Test against a mail sandbox or test inbox before using real recipients.

### 15.7 Verify the main flows

1. Log in using a development account.
2. Add a catalog book and confirm its embedding status becomes ready.
3. Ask a semantic recommendation query and check all three library status categories.
4. Ask a known FAQ and an intentionally unanswerable question to test the one-retry fallback.
5. Search a research topic and verify the output includes real search result links.
6. Create a test loan with a past due date and `returned_at = NULL`; verify an email is sent once according to policy.
7. Load a sample purchase log and confirm metric calculations before testing the LLM narrative.

## 16. Running and Operating the Application

### Admin operations

- Create/edit books and inspect their embedding status.
- Retry failed embedding jobs.
- Update stock/availability without unnecessarily regenerating vectors.
- Inspect loan due dates and notification outcomes.
- Request analytics for a clearly specified time range.
- Verify research/LLM provider failures through safe logs and request IDs.

### User operations

- Search books by topic or natural-language request.
- Distinguish library-owned recommendations from external LLM suggestions.
- Check a book's latest availability before relying on the displayed status.
- Ask questions supported by FAQs and use the displayed support contact when an answer is unavailable.
- View their own loans and due dates.

### Logging

Log useful operational context such as request ID, event type, duration, workflow status, error code, provider name, and affected non-sensitive record ID. Do not log passwords, tokens, API keys, full sensitive document contents, or unnecessary personally identifiable information.

## 17. Security and Reliability

### Authentication and authorization

- Authenticate users through the identity method implemented by the application.
- If local passwords are used, store only vetted password hashes.
- Enforce admin permissions on FastAPI endpoints, not just in the frontend.
- A user's loan views must be restricted to their own loans unless a permitted admin action applies.
- Derive the acting user from a validated session/token. Do not accept a user ID or role sent by the browser as proof of identity.

### Data integrity

- PostgreSQL owns current book existence and availability.
- The vector table is a searchable projection of book descriptions, not the source of truth for stock or catalog state.
- Purchase logs must only record successful purchases and should use stable IDs/idempotency to prevent duplication.
- Loan-return status must be updated by authorized application logic, not by an LLM.
- Notification sending should be idempotent or have explicit duplicate prevention.

### LLM safety

- Treat LLM output as untrusted until parsed and validated.
- Restrict recommendation output to a known JSON schema.
- Require a catalog match before assigning a result to `in_library_available` or `in_library_out_of_stock`.
- The LLM cannot assign stock quantities, mark loans as returned, send arbitrary emails, modify roles, or write purchases.
- Do not expose secrets, personal purchase history, or raw log content to the model unless strictly needed and permitted.
- If a prompt or external search result requests actions outside the workflow, treat it as content, not an instruction.

### File, API, and email safety

- Use HTTPS in deployment.
- Restrict CORS to trusted frontend origins.
- Rate-limit public/authentication and expensive AI endpoints.
- Validate all request fields and e-book upload sizes/types if file uploads are supported.
- Keep e-book files private and authorize before generating any download URL.
- Store SMTP/SerpAPI/LLM secrets in environment or secret management.
- Configure email sending limits and safe recipient handling.

### Failure handling

- If embedding generation fails, preserve the catalog record and show indexing failure state.
- If pgvector retrieval returns no suitable match, return an honest empty/relevant fallback response.
- If SerpAPI is unavailable, show a temporary search error or no-results fallback; do not fabricate papers.
- If email send fails, record the failure and permit a safe retry.
- If analytics parsing encounters malformed rows, report skipped/invalid records rather than silently treating them as zero-value purchases.

## 18. Testing and Evaluation

### Unit tests

- Search-text construction from book fields.
- Book status derivation from current stock.
- Recommendation schema validation and allowed status values.
- Title/author normalization and deduplication.
- FAQ threshold and retry-count behavior.
- Overdue eligibility and duplicate-reminder rules.
- Purchase parsing, time-zone handling, and exact metric calculations.

### API integration tests

- Admin can add/edit a book; a normal user cannot call admin routes.
- A newly added book can be found by semantic search after indexing succeeds.
- A stock-only edit does not trigger unnecessary re-embedding.
- A user cannot view another user's loans.
- Recommendation results contain all three required fields for every item.
- Unmatched LLM suggestions are labelled not in library.
- FAQ makes at most one retry before returning support fallback.
- Research results preserve source links and handle missing metadata.
- Failed email delivery is recorded and does not mark the loan as returned.
- Analytics endpoints reject unauthorized users.

### RAG/recommendation evaluation

Build a small test set of representative user queries and expected books. Measure:

- **Retrieval relevance:** are genuinely relevant catalog books returned near the top?
- **Coverage:** are relevant books missed by vector retrieval?
- **Status accuracy:** does the status always match the current catalog and stock record?
- **Deduplication:** are catalog matches and LLM suggestions merged correctly?
- **External suggestion accuracy:** are suggestions described conservatively and, where possible, verified?
- **Fallback correctness:** does the system avoid inventing books when both sources fail?

Do not claim a specific accuracy improvement until results are measured on a repeatable test set.

### Analytics evaluation

- Compare totals calculated by the application against hand-checked test fixtures.
- Ensure time filters use the intended time zone and inclusive/exclusive range boundaries.
- Validate chart JSON against the frontend schema.
- Ensure the narrative does not claim trends contradicted by the provided metrics.

## 19. Deployment Guide

A minimal deployment can use a static frontend host, a FastAPI application host, managed PostgreSQL with pgvector, an email provider, and environment-based scheduled execution.

### Deployment checklist

- [ ] Create production PostgreSQL database and enable pgvector.
- [ ] Run reviewed database migrations.
- [ ] Configure production secrets and disable development credentials.
- [ ] Set trusted frontend origins in CORS configuration.
- [ ] Configure the LLM provider, embedding model and matching vector dimension.
- [ ] Configure SerpAPI credentials server-side.
- [ ] Configure the email provider and a verified sender address.
- [ ] Set the support contact and application time zone.
- [ ] Configure the overdue scheduler and test idempotency.
- [ ] Set up backups for catalog, loans, purchase events, and other durable data.
- [ ] Define retention for logs and any personal analytics fields.
- [ ] Monitor API errors, embedding failures, provider failures, email failures, and scheduled-job runs.
- [ ] Validate access controls and secret handling before exposing the application publicly.

### Scaling without overengineering

Start with this simple architecture. Scale only when measurements show a bottleneck:

- If embeddings or external search make admin requests slow, move that work to a background task while keeping status visible.
- If catalog search becomes slow, tune PostgreSQL queries and pgvector indexes before adding another database.
- If purchase logs grow large or concurrent writes become unsafe, move the authoritative events into PostgreSQL and keep file export for analysis.
- If reminder delivery grows beyond the scheduler's capacity, use a durable job queue.
- Keep monitoring and testing in place so new components have a clear reason to exist.

## 20. Known Limitations and Design Decisions

- LLM-only book recommendations can be mistaken or outdated. They must remain clearly labelled as not in the library and ideally be checked against a reliable book metadata source.
- Similarity scores do not guarantee that a book is an exact answer to a request. Thresholds should be calibrated with test queries.
- Search result snippets from Google Scholar are not equivalent to reviewing a full research paper.
- The chosen embedding model determines vector dimension and search quality. Changing models requires an intentional re-indexing strategy.
- An LLM-generated analytics narrative is interpretive; exact arithmetic remains the job of deterministic code.
- CSV logs are simple but not ideal for high-concurrency writes, complex joins, or robust transactional processing.
- The real project may use different route names, authentication behavior, database fields, email provider, or UI structure. Update this README to match the repository implementation when those details are finalized.

## 21. Suggested Development Roadmap

### Phase 1 — Catalog and authentication

- Set up frontend, FastAPI, PostgreSQL and migrations.
- Implement sign-in and server-side authorization.
- Implement admin book CRUD, current stock fields, and basic catalog search.

### Phase 2 — pgvector recommendations

- Enable pgvector and add book embedding storage.
- Embed descriptive book fields on create/update.
- Add semantic search and live stock lookup.
- Add LLM-only suggestions with structured output, deduplication, and the three status labels.

### Phase 3 — FAQ assistant

- Create approved FAQ records and embeddings.
- Implement retrieval threshold and a single retry.
- Configure and show the support contact when no relevant answer is found.

### Phase 4 — Research-paper search

- Integrate SerpAPI Google Scholar search.
- Normalize result metadata, links, and duplicates.
- Handle no-results and provider-error cases.

### Phase 5 — Loans and email reminders

- Implement loans and return status.
- Add scheduled overdue selection and notification tracking.
- Test duplicate prevention and email failure recovery.

### Phase 6 — Purchase analytics

- Define the canonical purchase event schema.
- Record/export purchase events consistently.
- Implement exact metric calculations and chart series.
- Add the LLM explanation and validate its output.

### Phase 7 — Quality and deployment

- Add unit/integration tests and representative recommendation/FAQ cases.
- Review security, backups, secret management, error logging, and deployment settings.
- Measure latency, provider cost, retrieval quality, and email/job reliability before adding more infrastructure.

## 22. Interview Explanation

### 30-second explanation

“My project is a library and research assistant built with React, Vite, FastAPI, PostgreSQL/pgvector, and LangGraph. When an admin adds a book, the backend builds searchable text from its title, author, genre, and description, generates an embedding, and stores it against the book ID in pgvector. For a request such as ‘Suggest me Generative AI books,’ the system combines vector-retrieved catalog books with additional LLM suggestions, deduplicates them, and labels each result as available in the library, out of stock, or not in the library. LangGraph also routes FAQ questions through semantic retrieval with one retry and a customer-support fallback, and routes research requests to a SerpAPI Google Scholar search node. A scheduled task emails users whose loans are overdue and unreturned. Finally, admin analytics calculates exact metrics from purchase logs in code and uses an LLM to explain trends and help prepare charts.”

### Questions to prepare for

**Why pgvector instead of a separate vector database?**  
The current scale and design can keep catalog metadata and embeddings in PostgreSQL, reducing operational complexity and making it straightforward to join semantic matches with authoritative book and stock records.

**Why not put stock quantity inside the embedding?**  
Stock changes frequently and is not semantic book content. It belongs in PostgreSQL and should be read at query time, avoiding stale availability information and unnecessary re-embedding.

**How can LLM suggestions be separated from books the library owns?**  
Search pgvector and fetch actual book records from PostgreSQL. Merge the LLM suggestions with those records, normalize/deduplicate titles and authors, and assign an external status whenever there is no matching catalog record.

**What happens when embedding creation fails?**  
Keep the book record, mark indexing as pending/failed, log the failure, and retry. Do not claim the book is indexed until the vector upsert succeeds.

**How does the FAQ bot avoid hallucinating?**  
It retrieves approved FAQ content, checks relevance, performs one bounded retry, and then uses a support fallback instead of inventing an answer.

**What is the research node responsible for?**  
It searches Google Scholar result pages through SerpAPI and returns available bibliographic metadata and source links. It does not imply a full-paper review if only a search snippet was retrieved.

**How do the overdue emails avoid duplicates?**  
The scheduler filters out returned loans and checks recorded notification state. It records send outcomes and uses a defined reminder cadence or idempotency mechanism.

**Why use an LLM for analytics if code can calculate metrics?**  
Code is more reliable for exact totals, rates, and groupings. The LLM is used to explain already-calculated metrics and help format chart data, with output validation.

**What would you optimize first if usage grows?**  
Measure first. Improve database queries and pgvector indexing, add a background job for slow embedding/search operations, move purchase events into PostgreSQL if file concurrency becomes a problem, and introduce a durable queue only if the scheduler/job workload requires it.

## 23. Glossary

| Term | Simple meaning |
|---|---|
| Embedding | A numeric vector representation of text used to compare semantic meaning. |
| pgvector | PostgreSQL extension for storing vectors and performing similarity search. |
| Semantic search | Search based on meaning rather than only exact keyword matches. |
| RAG | Retrieval-Augmented Generation: retrieve relevant evidence and use it to ground an LLM answer. |
| LangGraph | A framework for defining stateful AI workflows as nodes and conditional edges. |
| SerpAPI | A service that provides structured results from supported search engines. |
| Google Scholar | Scholarly search service; its result snippets and metadata are not themselves a guarantee that the complete paper was read. |
| Fallback | A predefined alternative when the main workflow cannot provide a reliable answer. |
| Idempotency | Designing an operation so a retry does not create an unintended duplicate effect. |
| Source of truth | The authoritative place to read a fact; for book stock, that is the PostgreSQL catalog row. |
| Structured log | Events written in a predictable schema so they can be filtered and analyzed reliably. |

---

## Documentation Maintenance

Keep this README synchronized with the repository as implementation details become concrete. Update at least these items before presenting the project as fully implemented:

- Actual repository structure and commands.
- Exact database schema/migrations and embedding dimension.
- Model provider and model identifiers.
- Real API routes and payloads.
- Actual email provider and support contact configuration.
- Whether purchases are real transactions or the event log represents borrowing/checkout.
- Tests performed and measured results (avoid unsupported performance claims).
