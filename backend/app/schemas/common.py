from typing import Optional, Generic, TypeVar
from pydantic import BaseModel

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    error: ErrorDetail
    request_id: Optional[str] = "default-req-id"
