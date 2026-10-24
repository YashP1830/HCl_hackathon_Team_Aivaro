from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, field_validator, model_validator


# Authentication schemas: role is intentionally absent from public registration input.
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank.")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    email: EmailStr
    role: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


# Catalog contracts.
class BookCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    author: str = Field(min_length=1, max_length=300)
    description: str = Field(min_length=1)
    genre: str | None = Field(default=None, max_length=120)
    publisher: str | None = Field(default=None, max_length=200)
    publication_year: int | None = Field(default=None, ge=0, le=3000)
    stock_quantity: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def clean_required_text(self):
        for field in ("title", "author", "description"):
            value = getattr(self, field).strip()
            if not value:
                raise ValueError(f"{field} cannot be blank.")
            setattr(self, field, value)
        return self


class BookUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    author: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = Field(default=None, min_length=1)
    genre: str | None = Field(default=None, max_length=120)
    publisher: str | None = Field(default=None, max_length=200)
    publication_year: int | None = Field(default=None, ge=0, le=3000)
    stock_quantity: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def clean_changed_text(self):
        for field in ("title", "author", "description"):
            value = getattr(self, field)
            if value is not None:
                value = value.strip()
                if not value:
                    raise ValueError(f"{field} cannot be blank.")
                setattr(self, field, value)
        return self


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
    embedding_status: Literal["pending", "ready", "failed"]
    created_at: datetime
    updated_at: datetime


class BookListResponse(BaseModel):
    items: list[BookRead]
    total: int
    page: int
    page_size: int


class BookCreateResponse(BaseModel):
    book: BookRead
    embedding_status: Literal["pending", "ready", "failed"]


# AI contracts shared with Member C and the frontend.
LibraryStatus = Literal["in_library_available", "in_library_out_of_stock", "not_in_library"]


class RecommendationRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)


class RecommendationItem(BaseModel):
    book_name: str = Field(min_length=1)
    author: str = Field(min_length=1)
    description: str = Field(min_length=1)
    library_status: LibraryStatus
    book_id: UUID | None = None


class RecommendationResponse(BaseModel):
    query: str
    recommendations: list[RecommendationItem]


class FAQRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)


class FAQSource(BaseModel):
    faq_id: UUID | None = None
    question: str | None = None


class FAQResponse(BaseModel):
    answer: str
    status: Literal["answered", "fallback", "error"]
    support_contact: str | None = None
    sources: list[FAQSource] = Field(default_factory=list)


class ResearchRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=1000)
    max_results: int = Field(default=5, ge=1, le=20)


class ResearchResult(BaseModel):
    title: str
    authors: list[str] = Field(default_factory=list)
    year: int | None = None
    snippet: str | None = None
    url: HttpUrl | None = None
    doi: str | None = None


class ResearchResponse(BaseModel):
    topic: str
    results: list[ResearchResult]


class AnalyticsResponse(BaseModel):
    from_date: date
    to_date: date
    metrics: dict[str, int | float]
    narrative: str
    chart_data: dict[str, Any] | None = None
