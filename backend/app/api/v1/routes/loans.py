from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Book, Loan, User
from app.schemas.loans import LoanRead

router = APIRouter(prefix="/loans", tags=["loans"])


def _loan_response(loan: Loan, book_title: str) -> LoanRead:
    return LoanRead(
        id=loan.id,
        book_id=loan.book_id,
        book_title=book_title,
        borrowed_at=loan.borrowed_at,
        due_at=loan.due_at,
        returned_at=loan.returned_at,
    )


@router.get("/me", response_model=list[LoanRead])
def list_my_loans(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[LoanRead]:
    rows = db.execute(
        select(Loan, Book.title)
        .join(Book, Book.id == Loan.book_id)
        .where(Loan.user_id == user.id)
        .order_by(Loan.borrowed_at.desc())
    ).all()
    return [_loan_response(loan, title) for loan, title in rows]


@router.post("/{loan_id}/return", response_model=LoanRead)
def return_loan(
    loan_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LoanRead:
    # Lock the loan to make duplicate return requests safe under concurrency.
    loan = db.scalar(select(Loan).where(Loan.id == loan_id).with_for_update())
    if loan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found.")

    # Non-admin users may act only on their own loans. Return 404 to avoid leaking other loans.
    if user.role != "admin" and loan.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found.")
    if loan.returned_at is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This loan has already been returned.")

    book = db.scalar(select(Book).where(Book.id == loan.book_id).with_for_update())
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The book associated with this loan was not found.")

    loan.returned_at = datetime.now(timezone.utc)
    book.stock_quantity += 1
    db.commit()
    db.refresh(loan)
    return _loan_response(loan, book.title)
