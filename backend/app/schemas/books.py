from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BookCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    author: str = Field(default="Author not confirmed", max_length=300)
    description: str = Field(default="", max_length=20000)
    genre: str | None = Field(default=None, max_length=160)
    publisher: str | None = Field(default=None, max_length=200)
    publication_year: int | None = Field(default=None, ge=1450, le=2200)
    stock_quantity: int = Field(default=0, ge=0)


class BookUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    author: str | None = Field(default=None, max_length=300)
    description: str | None = Field(default=None, max_length=20000)
    genre: str | None = Field(default=None, max_length=160)
    publisher: str | None = Field(default=None, max_length=200)
    publication_year: int | None = Field(default=None, ge=1450, le=2200)
    stock_quantity: int | None = Field(default=None, ge=0)


class BookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    author: str
    description: str
    genre: str | None
    publisher: str | None
    publication_year: int | None
    stock_quantity: int
    availability_status: Literal["available", "out_of_stock"]
    embedding_status: Literal["pending", "ready", "failed"]
    created_at: datetime
    updated_at: datetime


LibraryStatus = Literal[
    "in_library_available",
    "in_library_out_of_stock",
    "not_in_library",
]


class RecommendationItem(BaseModel):
    book_name: str = Field(min_length=1)
    author: str = Field(min_length=1)
    description: str = Field(min_length=1)
    library_status: LibraryStatus
    book_id: UUID | None = None


class RecommendationRequest(BaseModel):
    query: str = Field(min_length=2, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=20)


class RecommendationResponse(BaseModel):
    query: str
    recommendations: list[RecommendationItem]
