from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from backend.app.models.book import Book
from backend.app.schemas.book import BookCreate, BookUpdate

class BookRepository:
    @staticmethod
    def get_by_id(db: Session, book_id: UUID) -> Optional[Book]:
        return db.query(Book).filter(Book.id == book_id).first()

    @staticmethod
    def list_books(db: Session, query: Optional[str] = None, skip: int = 0, limit: int = 20) -> List[Book]:
        q = db.query(Book)
        if query:
            q = q.filter((Book.title.ilike(f"%{query}%")) | (Book.author.ilike(f"%{query}%")))
        return q.offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, book_in: BookCreate) -> Book:
        db_book = Book(**book_in.model_dump())
        db.add(db_book)
        db.commit()
        db.refresh(db_book)
        return db_book

    @staticmethod
    def update(db: Session, db_book: Book, book_in: BookUpdate) -> Tuple[Book, bool]:
        update_data = book_in.model_dump(exclude_unset=True)
        descriptive_changed = any(k in update_data for k in ["title", "author", "description", "genre", "publisher"])
        for field, value in update_data.items():
            setattr(db_book, field, value)
        db.commit()
        db.refresh(db_book)
        return db_book, descriptive_changed
