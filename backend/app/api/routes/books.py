from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_admin
from app.db.session import get_db
from app.models.entities import Book, User
from app.schemas.books import BookCreate, BookRead, BookUpdate

router = APIRouter(tags=["books"])


def _read(book: Book) -> BookRead:
    return BookRead(
        id=book.id,
        title=book.title,
        author=book.author,
        description=book.description,
        genre=book.genre,
        publisher=book.publisher,
        publication_year=book.publication_year,
        stock_quantity=book.stock_quantity,
        availability_status=book.availability_status,
        embedding_status=book.embedding_status,
        created_at=book.created_at,
        updated_at=book.updated_at,
    )


@router.get("/books", response_model=list[BookRead])
def list_books(
    q: str | None = Query(default=None, max_length=200),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[BookRead]:
    statement = select(Book)
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        statement = statement.where(
            or_(
                Book.title.ilike(pattern),
                Book.author.ilike(pattern),
                Book.description.ilike(pattern),
                Book.genre.ilike(pattern),
            )
        )
    books = db.scalars(
        statement.order_by(Book.title.asc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return [_read(book) for book in books]


@router.get("/books/{book_id}", response_model=BookRead)
def get_book(
    book_id: UUID,
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookRead:
    book = db.get(Book, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return _read(book)


@router.post("/admin/books", response_model=BookRead, status_code=status.HTTP_201_CREATED)
def create_book(
    payload: BookCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> BookRead:
    book = Book(**payload.model_dump(), embedding_status="pending")
    db.add(book)
    db.commit()
    db.refresh(book)
    # Integration point: call Member C's embedding service after it is implemented.
    # Pending is intentional until the pgvector upsert succeeds.
    return _read(book)


@router.patch("/admin/books/{book_id}", response_model=BookRead)
def update_book(
    book_id: UUID,
    payload: BookUpdate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> BookRead:
    book = db.get(Book, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")

    changes = payload.model_dump(exclude_unset=True)
    non_nullable_fields = {"title", "author", "description", "stock_quantity"}
    null_fields = sorted(
        field for field in non_nullable_fields if field in changes and changes[field] is None
    )
    if null_fields:
        raise HTTPException(
            status_code=422,
            detail=f"These fields cannot be null: {', '.join(null_fields)}",
        )

    descriptive_fields = {"title", "author", "description", "genre", "publisher", "publication_year"}
    needs_reembedding = any(
        field in changes and getattr(book, field) != value
        for field, value in changes.items()
        if field in descriptive_fields
    )
    for field, value in changes.items():
        setattr(book, field, value)
    if needs_reembedding:
        book.embedding_status = "pending"
    db.commit()
    db.refresh(book)
    # A stock-only change intentionally does not invalidate the embedding.
    return _read(book)
