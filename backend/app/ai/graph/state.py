from typing import TypedDict, Optional, List, Dict, Any

class FAQState(TypedDict):
    question: str
    rephrased_question: Optional[str]
    retries: int
    match: Optional[Dict[str, Any]]
    is_relevant: bool
    status: str
    answer: str
    support_contact: Optional[str]
    sources: List[Dict[str, Any]]