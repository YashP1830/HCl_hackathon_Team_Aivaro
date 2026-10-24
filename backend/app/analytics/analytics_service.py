from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.analytics.log_parser import PurchaseLogParser
from backend.app.analytics.metrics import MetricCalculator
from backend.app.analytics.llm_explainer import LLMAnalyticsExplainer

class AnalyticsService:
    def __init__(self):
        self.explainer = LLMAnalyticsExplainer()

    def generate_report(
        self, 
        db: Session, 
        start_date: Optional[str] = None, 
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        purchases = PurchaseLogParser.get_purchases_window(db, start_date, end_date)
        metrics = MetricCalculator.calculate_exact_metrics(purchases)
        report = self.explainer.explain_metrics(metrics)
        return report.model_dump()