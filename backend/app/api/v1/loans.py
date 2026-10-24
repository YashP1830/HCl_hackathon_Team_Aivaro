from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.dependencies import get_db, get_current_user
from backend.app.models.user import User
from backend.app.repositories.loan_repository import LoanRepository
from backend.app.schemas.loan import LoanResponse

router = APIRouter(prefix="/loans", tags=["Loans"])

@router.get("/me", response_model=List[LoanResponse])
def get_my_loans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return LoanRepository.get_user_loans(db, current_user.id)

@router.post("/{loan_id}/return", response_model=LoanResponse)
def return_borrowed_book(
    loan_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loan = LoanRepository.get_by_id(db, loan_id)
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")
    
    if current_user.role != "admin" and loan.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot return another user's loan")
    
    if loan.returned_at is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Book already returned")

    return LoanRepository.return_book(db, loan)
