"""Stable service interfaces shared between FastAPI and the AI workstream.

Member C should implement these interfaces behind the same method signatures.
Route handlers and ORM models remain owned by the integration lead.
"""
from typing import Protocol, runtime_checkable

from app.schemas.books import RecommendationResponse


@runtime_checkable
class EmbeddingService(Protocol):
    def embed_text(self, text: str) -> list[float]:
        """Return a vector matching EMBEDDING_DIMENSION."""
        ...


@runtime_checkable
class RecommendationService(Protocol):
    def recommend(self, query: str, top_k: int = 5) -> RecommendationResponse:
        """Return normalized catalog and LLM-only recommendations."""
        ...


@runtime_checkable
class FAQService(Protocol):
    def answer(self, question: str) -> dict:
        """Return {answer, status, support_contact, sources}."""
        ...


@runtime_checkable
class ResearchService(Protocol):
    def search(self, topic: str, max_results: int = 5) -> dict:
        """Return normalized scholarly results and real source URLs."""
        ...
