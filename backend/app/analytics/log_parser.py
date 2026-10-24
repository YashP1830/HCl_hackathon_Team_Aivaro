from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session

class PurchaseLogParser:
    @staticmethod
    def get_purchases_window(
        db: Session, 
        start_date: Optional[str] = None, 
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query_str = """
            SELECT 
                purchase_id,
                user_id,
                book_id,
                book_title,
                purchased_at,
                quantity,
                amount
            FROM purchase_events
            WHERE 1=1
        """
        params: Dict[str, Any] = {}
        if start_date:
            query_str += " AND purchased_at >= :start_date"
            params["start_date"] = start_date
        if end_date:
            query_str += " AND purchased_at <= :end_date"
            params["end_date"] = end_date

        query_str += " ORDER BY purchased_at ASC"
        rows = db.execute(text(query_str), params).mappings().all()
        return [dict(r) for r in rows]