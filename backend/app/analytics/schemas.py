from pydantic import BaseModel, Field
from typing import List, Dict, Any

class ChartDataPoint(BaseModel):
    label: str
    value: float

class ChartSpec(BaseModel):
    chart_type: str = Field(description="Type of chart, e.g., 'bar', 'line', 'pie'")
    title: str
    data: List[ChartDataPoint]

class AnalyticsReport(BaseModel):
    total_revenue: float
    total_purchases: int
    top_selling_books: List[Dict[str, Any]]
    narrative_explanation: str
    charts: List[ChartSpec]