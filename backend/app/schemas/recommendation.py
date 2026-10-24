from typing import List, Optional
from pydantic import BaseModel, Field

class RecommendationItem(BaseModel):
    book_name: str
    author: str
    description: str
    library_status: str = Field(..., example="in_library_available") # in_library_available, in_library_out_of_stock, not_in_library
    book_id: Optional[str] = None

class RecommendationRequest(BaseModel):
    query: str
    top_k: int = 5

class RecommendationResponse(BaseModel):
    query: str
    recommendations: List[RecommendationItem]
