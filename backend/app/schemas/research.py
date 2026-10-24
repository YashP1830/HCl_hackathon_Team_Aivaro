from typing import List, Optional
from pydantic import BaseModel

class ResearchRequest(BaseModel):
    topic: str
    max_results: int = 5

class ResearchResultItem(BaseModel):
    title: str
    authors: List[str] = []
    year: Optional[int] = None
    snippet: str
    url: Optional[str] = None
    doi: Optional[str] = None

class ResearchResponse(BaseModel):
    topic: str
    results: List[ResearchResultItem]
