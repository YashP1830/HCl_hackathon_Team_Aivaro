from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class LoanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    book_id: UUID
    book_title: str
    borrowed_at: datetime
    due_at: datetime
    returned_at: datetime | None
