from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class FAQRequest(BaseModel):
    question: str

class FAQResponse(BaseModel):
    answer: str
    status: str # answered, fallback, error
    support_contact: Optional[str] = None
    sources: List[Dict[str, Any]] = []
