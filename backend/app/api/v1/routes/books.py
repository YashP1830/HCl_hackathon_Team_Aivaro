from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models import Book, User
from app.schemas import BookCreate, BookCreateResponse, BookListResponse, BookRead, BookUpdate

router = APIRouter(tags=["books"])
_DESCRIPTIVE_FIELDS = {"title", "author", "description", "genre", "publisher", "publication_year"}


def _mark_embedding_failed(db: Session, book_id: UUID) -> str:
    """Persist failed indexing without deleting the already-saved catalog row."""
    try:
        db.rollback()
        persisted = db.get(Book, book_id)
        if persisted is not None:
            persisted.embedding_status = "failed"
            db.commit()
            db.refresh(persisted)
    except Exception:
        db.rollback()
    return "failed"


def _apply_embedding_sync(db: Session, book: Book) -> str:
    """Use Member C's sync_book_embedding(db=..., book=...) service when it is available.

    The saved catalog row remains durable when the service is not integrated or fails.
    The service must return only after the pgvector upsert succeeds.
    """
    try:
        from app.ai.embeddings import sync_book_embedding
    except ModuleNotFoundError as exc:
        if exc.name in {"app.ai", "app.ai.embeddings"}:
            return "pending"
        return _mark_embedding_failed(db, book.id)
    except Exception:
        return _mark_embedding_failed(db, book.id)

    try:
        sync_book_embedding(db=db, book=book)
        book.embedding_status = "ready"
        db.commit()
        db.refresh(book)
        return "ready"
    except Exception:
        return _mark_embedding_failed(db, book.id)


def _response(book: Book) -> BookCreateResponse:
    return BookCreateResponse(book=BookRead.model_validate(book), embedding_status=book.embedding_status)


@router.get("/books", response_model=BookListResponse)
def list_books(
    q: str | None = Query(default=None, max_length=300),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> BookListResponse:
    statement = select(Book)
    count_statement = select(func.count()).select_from(Book)
    if q and q.strip():
        term = f"%{q.strip()}%"
        filters = or_(Book.title.ilike(term), Book.author.ilike(term), Book.description.ilike(term))
        statement = statement.where(filters)
        count_statement = count_statement.where(filters)

    total = db.scalar(count_statement) or 0
    records = db.scalars(
        statement.order_by(Book.title.asc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return BookListResponse(
        items=[BookRead.model_validate(record) for record in records],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/books/{book_id}", response_model=BookRead)
def get_book(
    book_id: UUID,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> BookRead:
    book = db.get(Book, book_id)
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")
    return BookRead.model_validate(book)


@router.post("/admin/books", response_model=BookCreateResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    payload: BookCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> BookCreateResponse:
    book = Book(**payload.model_dump(), embedding_status="pending")
    db.add(book)
    db.commit()
    db.refresh(book)

    # First persist the book; indexing is then attempted and status is updated honestly.
    _apply_embedding_sync(db, book)
    db.refresh(book)
    return _response(book)


@router.patch("/admin/books/{book_id}", response_model=BookCreateResponse)
def update_book(
    book_id: UUID,
    payload: BookUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> BookCreateResponse:
    book = db.get(Book, book_id)
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    changes = payload.model_dump(exclude_unset=True)
    for field in ("title", "author", "description", "stock_quantity"):
        if field in changes and changes[field] is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{field} cannot be null.")

    reindex = any(field in changes for field in _DESCRIPTIVE_FIELDS)
    for field, value in changes.items():
        setattr(book, field, value)
    if reindex:
        book.embedding_status = "pending"

    db.commit()
    db.refresh(book)
    if reindex:
        _apply_embedding_sync(db, book)
        db.refresh(book)
    # A stock-only patch never calls the embedding model.
    return _response(book)
