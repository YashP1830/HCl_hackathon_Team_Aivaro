from typing import List, Dict, Any, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

class VectorStoreRetrieval:
    @staticmethod
    def search_books(db: Session, query_vector: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves matching book IDs and distance using cosine distance operator '<=>'.
        """
        vector_str = "[" + ",".join(map(str, query_vector)) + "]"
        query = text("""
            SELECT 
                b.id,
                b.title,
                b.author,
                b.description,
                b.stock_quantity,
                (be.embedding <=> :query_vector) AS distance
            FROM book_embeddings be
            JOIN books b ON be.book_id = b.id
            ORDER BY distance ASC
            LIMIT :top_k
        """)
        results = db.execute(query, {"query_vector": vector_str, "top_k": top_k}).mappings().all()
        return [dict(row) for row in results]

    @staticmethod
    def search_faqs(db: Session, query_vector: List[float], top_k: int = 1) -> List[Dict[str, Any]]:
        """
        Retrieves matching FAQ entries using cosine distance.
        """
        vector_str = "[" + ",".join(map(str, query_vector)) + "]"
        query = text("""
            SELECT 
                f.id,
                f.question,
                f.answer,
                f.category,
                (fe.embedding <=> :query_vector) AS distance
            FROM faq_embeddings fe
            JOIN faqs f ON fe.faq_id = f.id
            ORDER BY distance ASC
            LIMIT :top_k
        """)
        results = db.execute(query, {"query_vector": vector_str, "top_k": top_k}).mappings().all()
        return [dict(row) for row in results]