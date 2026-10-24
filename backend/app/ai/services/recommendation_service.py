import json
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from openai import OpenAI
from backend.app.ai.embeddings.provider import OpenAIEmbedder
from backend.app.ai.retrieval.vector_store import VectorStoreRetrieval
from backend.app.ai.prompts.recommendation_prompts import RECOMMENDATION_SYSTEM_PROMPT
from backend.app.ai.config import LLM_API_KEY, LLM_MODEL

class RecommendationService:
    def __init__(self):
        self.embedder = OpenAIEmbedder()
        self.client = OpenAI(api_key=LLM_API_KEY)

    @staticmethod
    def _normalize(s: Optional[str]) -> str:
        if not s:
            return ""
        return re.sub(r"[^a-zA-Z0-9]", "", s).lower()

    def _get_catalog_book_by_title_author(self, db: Session, title: str, author: str) -> Optional[Dict[str, Any]]:
        norm_title = self._normalize(title)
        query = text("SELECT id, title, author, description, stock_quantity FROM books")
        rows = db.execute(query).mappings().all()
        for r in rows:
            if self._normalize(r["title"]) == norm_title:
                return dict(r)
        return None

    def recommend_books(self, db: Session, query: str, top_k: int = 5) -> Dict[str, Any]:
        query_vector = self.embedder.embed_text(query)
        db_books = VectorStoreRetrieval.search_books(db, query_vector, top_k=top_k)

        response = self.client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": RECOMMENDATION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Query: {query}\nSuggest {top_k} books."}
            ],
            response_format={"type": "json_object"}
        )
        raw_llm = json.loads(response.choices[0].message.content or "{}")
        llm_books = raw_llm.get("recommendations", [])

        recommendations = []
        seen_keys = set()

        # 1. Process Database Books
        for b in db_books:
            title = b.get("title") or "Unknown Title"
            author = b.get("author") or "Author not confirmed"
            key = (self._normalize(title), self._normalize(author))
            seen_keys.add(key)

            stock = b.get("stock_quantity", 0)
            status = "in_library_available" if stock > 0 else "in_library_out_of_stock"

            recommendations.append({
                "book_name": title,
                "author": author,
                "description": b.get("description") or "",
                "library_status": status,
                "book_id": str(b.get("id"))
            })

        # 2. Process LLM Candidate Books
        for lb in llm_books:
            title = lb.get("book_name") or "Unknown Title"
            author = lb.get("author") or "Author not confirmed"
            desc = lb.get("description") or ""
            key = (self._normalize(title), self._normalize(author))

            if key in seen_keys:
                continue
            seen_keys.add(key)

            catalog_match = self._get_catalog_book_by_title_author(db, title, author)
            if catalog_match:
                stock = catalog_match.get("stock_quantity", 0)
                status = "in_library_available" if stock > 0 else "in_library_out_of_stock"
                book_id = str(catalog_match.get("id"))
            else:
                status = "not_in_library"
                book_id = None

            recommendations.append({
                "book_name": title,
                "author": author,
                "description": desc,
                "library_status": status,
                "book_id": book_id
            })

        return {
            "query": query,
            "recommendations": recommendations[:top_k * 2]
        }