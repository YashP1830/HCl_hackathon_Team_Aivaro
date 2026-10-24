from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models.loan import Loan
from backend.app.models.book import Book

class LoanRepository:
    @staticmethod
    def get_user_loans(db: Session, user_id: UUID) -> List[Loan]:
        return db.query(Loan).filter(Loan.user_id == user_id).all()

    @staticmethod
    def get_by_id(db: Session, loan_id: UUID) -> Optional[Loan]:
        return db.query(Loan).filter(Loan.id == loan_id).first()

    @staticmethod
    def return_book(db: Session, loan: Loan) -> Loan:
        loan.returned_at = datetime.now(timezone.utc)
        # Restore stock quantity
        book = db.query(Book).filter(Book.id == loan.book_id).first()
        if book:
            book.stock_quantity += 1
        db.commit()
        db.refresh(loan)
        return loan
