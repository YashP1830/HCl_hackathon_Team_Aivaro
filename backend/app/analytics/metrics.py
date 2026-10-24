from typing import List, Dict, Any
from collections import defaultdict

class MetricCalculator:
    @staticmethod
    def calculate_exact_metrics(purchases: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_revenue = 0.0
        total_quantity = 0
        book_counts = defaultdict(lambda: {"count": 0, "revenue": 0.0, "title": ""})

        for p in purchases:
            qty = int(p.get("quantity", 0))
            amt = float(p.get("amount", 0.0))
            title = p.get("book_title", "Unknown Title")
            b_id = str(p.get("book_id", "Unknown"))

            total_revenue += amt
            total_quantity += qty
            book_counts[b_id]["count"] += qty
            book_counts[b_id]["revenue"] += amt
            book_counts[b_id]["title"] = title

        top_selling = sorted(
            [
                {"book_id": k, "title": v["title"], "quantity": v["count"], "revenue": v["revenue"]}
                for k, v in book_counts.items()
            ],
            key=lambda x: x["quantity"],
            reverse=True
        )[:5]

        return {
            "total_purchases": len(purchases),
            "total_units_sold": total_quantity,
            "total_revenue": round(total_revenue, 2),
            "top_selling_books": top_selling
        }