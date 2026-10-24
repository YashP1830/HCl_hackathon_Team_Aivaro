from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.dependencies import get_db
from backend.app.schemas.faq import FAQRequest, FAQResponse
from backend.app.ai.services.faq_service import FAQService

router = APIRouter(prefix="/chat", tags=["FAQ Chatbot"])

@router.post("/faq", response_model=FAQResponse)
def chat_faq(req: FAQRequest, db: Session = Depends(get_db)):
    return FAQService.answer_faq(db, question=req.question)
