# Internal backend service contracts

Owner: Member A (integration lead). Implementations belong to Member C in the service directories below. Public request/response field names remain defined in app/schemas.

## Embedding sync

Import path: app.ai.embeddings

Function signature:
sync_book_embedding(*, db: Session, book: Book) -> None

Requirements:
- The book row has already been committed before this function is called.
- Build embedded text from title, author, description, genre, and publisher only. Never include stock_quantity.
- Use the configured embedding model and validate output length against EMBEDDING_DIMENSION.
- Upsert the book_embeddings row keyed by book_id.
- Use the supplied SQLAlchemy session and do not commit it; Member A owns the status/commit boundary.
- Return only after the vector upsert has succeeded in the transaction. Raise on failure so the API can mark embedding_status=failed.
- A stock-only edit must not call this function.

## Recommendations

Import path: app.ai.recommendations

Function signature:
recommend_books(*, db: Session, query: str, top_k: int) -> RecommendationResponse

Requirements:
- Combine pgvector catalog matches with LLM candidates.
- Verify candidates and current stock through PostgreSQL.
- Return the exact RecommendationResponse schema; each item needs book_name, author, description, library_status, and book_id.
- Allowed statuses are in_library_available, in_library_out_of_stock, and not_in_library. The LLM must not assign the status.
- Deduplicate catalog results and LLM suggestions.

## FAQ

Import path: app.ai.faq_workflow

Function signature:
answer_faq(*, db: Session, question: str, support_contact: str | None) -> FAQResponse

Requirements:
- Retrieve approved FAQ content, judge relevance, reformulate and retry at most once, then return a fallback with the configured support contact.
- Return status answered, fallback, or error. Never invent support details.

## Research search

Import path: app.ai.research

Function signature:
search_research_papers(*, topic: str, max_results: int, api_key: str) -> ResearchResponse

Requirements:
- Use SerpAPI Google Scholar results only; normalize and deduplicate available metadata.
- Do not invent missing authors, years, links, or DOI values.
- A search-result snippet is not a full-paper summary.

## Admin analytics

Import path: app.analytics.service

Function signature:
build_analytics_report(*, db: Session, from_date: date, to_date: date) -> AnalyticsResponse

Requirements:
- Calculate exact metrics in Python/SQL before calling an LLM.
- Use confirmed purchase_events only; do not mix in loans.
- Return narrative and chart data that conforms to AnalyticsResponse.
- Redact unnecessary personal information and validate chart structures before returning.

## Integration rule

The public route wrappers dynamically import these functions. Until a service module is present, the associated endpoint returns HTTP 503. Do not change a signature or response schema silently; coordinate one contract change with the whole team.
