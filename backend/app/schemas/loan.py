from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class LoanResponse(BaseModel):
    id: UUID
    user_id: UUID
    book_id: UUID
    borrowed_at: datetime
    due_at: datetime
    returned_at: Optional[datetime] = None

    class Config:
        from_attributes = True
