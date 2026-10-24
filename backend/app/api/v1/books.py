from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.core.dependencies import get_db, require_admin
from backend.app.models.user import User
from backend.app.repositories.book_repository import BookRepository
from backend.app.schemas.book import BookCreate, BookUpdate, BookResponse, BookAdminCreateResponse

router = APIRouter(tags=["Books"])

@router.get("/books", response_model=List[BookResponse])
def list_books(
    q: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * page_size
    return BookRepository.list_books(db, query=q, skip=skip, limit=page_size)

@router.get("/books/{book_id}", response_model=BookResponse)
def get_book(book_id: UUID, db: Session = Depends(get_db)):
    book = BookRepository.get_by_id(db, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book

@router.post("/admin/books", response_model=BookAdminCreateResponse, status_code=status.HTTP_201_CREATED)
def admin_create_book(
    book_in: BookCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    book = BookRepository.create(db, book_in)
    
    # Trigger embedding sync through Member C's interface (gracefully handoff)
    embedding_status = "ready"
    detail = None
    try:
        from backend.app.ai.embeddings.provider import OpenAIEmbedder
        from backend.app.models.embedding import BookEmbedding
        from backend.app.core.config import settings

        embedder = OpenAIEmbedder()
        embed_text = f"{book.title} by {book.author}. {book.description} Genre: {book.genre}"
        vec = embedder.embed_text(embed_text)

        b_emb = BookEmbedding(
            book_id=book.id,
            embedding=vec,
            embedded_text=embed_text,
            embedding_model=settings.EMBEDDING_MODEL
        )
        db.merge(b_emb)
        book.embedding_status = "ready"
        db.commit()
    except Exception as e:
        book.embedding_status = "failed"
        db.commit()
        embedding_status = "failed"
        detail = f"Vector generation failed: {str(e)}"

    db.refresh(book)
    return BookAdminCreateResponse(book=book, embedding_status=embedding_status, detail=detail)

@router.patch("/admin/books/{book_id}", response_model=BookResponse)
def admin_update_book(
    book_id: UUID,
    book_in: BookUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    book = BookRepository.get_by_id(db, book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    
    updated_book, desc_changed = BookRepository.update(db, book, book_in)

    if desc_changed:
        try:
            from backend.app.ai.embeddings.provider import OpenAIEmbedder
            from backend.app.models.embedding import BookEmbedding
            from backend.app.core.config import settings

            embedder = OpenAIEmbedder()
            embed_text = f"{updated_book.title} by {updated_book.author}. {updated_book.description} Genre: {updated_book.genre}"
            vec = embedder.embed_text(embed_text)

            b_emb = BookEmbedding(
                book_id=updated_book.id,
                embedding=vec,
                embedded_text=embed_text,
                embedding_model=settings.EMBEDDING_MODEL
            )
            db.merge(b_emb)
            updated_book.embedding_status = "ready"
            db.commit()
        except Exception:
            updated_book.embedding_status = "failed"
            db.commit()

    db.refresh(updated_book)
    return updated_book
