from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from backend.app.db.session import Base
from backend.app.core.config import settings

class BookEmbedding(Base):
    __tablename__ = "book_embeddings"

    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    embedding = Column(Vector(settings.EMBEDDING_DIMENSION), nullable=False)
    embedded_text = Column(Text, nullable=False)
    embedding_model = Column(String(100), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

class FAQEmbedding(Base):
    __tablename__ = "faq_embeddings"

    faq_id = Column(UUID(as_uuid=True), ForeignKey("faqs.id", ondelete="CASCADE"), primary_key=True)
    embedding = Column(Vector(settings.EMBEDDING_DIMENSION), nullable=False)
    embedded_text = Column(Text, nullable=False)
    embedding_model = Column(String(100), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
