from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class BookBase(BaseModel):
    title: str = Field(..., example="Generative AI Fundamentals")
    author: str = Field(..., example="Example Author")
    description: str = Field(..., example="An introduction to generative AI.")
    genre: Optional[str] = "Artificial Intelligence"
    publisher: Optional[str] = "Example Publisher"
    publication_year: Optional[int] = 2025
    stock_quantity: int = Field(default=0, ge=0)

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None
    genre: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    stock_quantity: Optional[int] = Field(None, ge=0)

class BookResponse(BookBase):
    id: UUID
    embedding_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BookAdminCreateResponse(BaseModel):
    book: BookResponse
    embedding_status: str
    detail: Optional[str] = None
