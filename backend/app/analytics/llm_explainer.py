import json
from openai import OpenAI
from backend.app.ai.config import LLM_API_KEY, LLM_MODEL
from backend.app.analytics.schemas import AnalyticsReport

class LLMAnalyticsExplainer:
    def __init__(self):
        self.client = OpenAI(api_key=LLM_API_KEY)

    def explain_metrics(self, computed_metrics: dict) -> AnalyticsReport:
        prompt = f"""
        You are an analytics assistant. Below are strictly precomputed deterministic sales metrics:
        Total Purchases Count: {computed_metrics['total_purchases']}
        Total Units Sold: {computed_metrics['total_units_sold']}
        Total Revenue: {computed_metrics['total_revenue']}
        Top Selling Books: {json.dumps(computed_metrics['top_selling_books'])}

        Provide:
        1. A clear narrative explanation of sales trends.
        2. A structured chart proposal with data matching the numbers exactly.
        
        Strict JSON Output format:
        {{
          "total_revenue": {computed_metrics['total_revenue']},
          "total_purchases": {computed_metrics['total_purchases']},
          "top_selling_books": {json.dumps(computed_metrics['top_selling_books'])},
          "narrative_explanation": "string",
          "charts": [
            {{
              "chart_type": "bar",
              "title": "Top Selling Books by Quantity",
              "data": [
                {{"label": "Book Title", "value": 10}}
              ]
            }}
          ]
        }}
        """
        response = self.client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content or "{}")
        # Validate schema
        return AnalyticsReport(**data)