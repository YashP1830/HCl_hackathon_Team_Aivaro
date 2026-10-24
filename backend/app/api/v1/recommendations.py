from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.dependencies import get_db
from backend.app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from backend.app.ai.services.recommendation_service import RecommendationService

router = APIRouter(tags=["AI Recommendations"])
rec_service = RecommendationService()

@router.post("/recommendations", response_model=RecommendationResponse)
def get_recommendations(req: RecommendationRequest, db: Session = Depends(get_db)):
    result = rec_service.recommend_books(db, query=req.query, top_k=req.top_k)
    return result
