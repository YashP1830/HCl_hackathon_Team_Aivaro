from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.models import User
from app.schemas import (
    AnalyticsResponse,
    FAQRequest,
    FAQResponse,
    RecommendationRequest,
    RecommendationResponse,
    ResearchRequest,
    ResearchResponse,
)

router = APIRouter(tags=["AI workflows", "analytics"])
_SERVICE_UNAVAILABLE = status.HTTP_503_SERVICE_UNAVAILABLE


@router.post("/recommendations", response_model=RecommendationResponse)
def recommend_books(
    payload: RecommendationRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> RecommendationResponse:
    try:
        from app.ai.recommendations import recommend_books as service
    except ModuleNotFoundError as exc:
        if exc.name in {"app.ai", "app.ai.recommendations"}:
            raise HTTPException(_SERVICE_UNAVAILABLE, detail="Recommendation service is not integrated yet.")
        raise
    return service(db=db, query=payload.query, top_k=payload.top_k)


@router.post("/chat/faq", response_model=FAQResponse)
def answer_faq(
    payload: FAQRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    _user: User = Depends(get_current_user),
) -> FAQResponse:
    try:
        from app.ai.faq_workflow import answer_faq as service
    except ModuleNotFoundError as exc:
        if exc.name in {"app.ai", "app.ai.faq_workflow"}:
            raise HTTPException(_SERVICE_UNAVAILABLE, detail="FAQ service is not integrated yet.")
        raise
    return service(db=db, question=payload.question, support_contact=settings.support_email)


@router.post("/research/search", response_model=ResearchResponse)
def search_research(
    payload: ResearchRequest,
    settings: Settings = Depends(get_settings),
    _user: User = Depends(get_current_user),
) -> ResearchResponse:
    if not settings.serpapi_api_key:
        raise HTTPException(_SERVICE_UNAVAILABLE, detail="SerpAPI is not configured.")
    try:
        from app.ai.research import search_research_papers as service
    except ModuleNotFoundError as exc:
        if exc.name in {"app.ai", "app.ai.research"}:
            raise HTTPException(_SERVICE_UNAVAILABLE, detail="Research service is not integrated yet.")
        raise
    return service(topic=payload.topic, max_results=payload.max_results, api_key=settings.serpapi_api_key)


@router.get("/admin/analytics", response_model=AnalyticsResponse)
def get_admin_analytics(
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
) -> AnalyticsResponse:
    if to_date < from_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The 'to' date must be on or after the 'from' date.",
        )
    try:
        from app.analytics.service import build_analytics_report as service
    except ModuleNotFoundError as exc:
        if exc.name in {"app.analytics", "app.analytics.service"}:
            raise HTTPException(_SERVICE_UNAVAILABLE, detail="Analytics service is not integrated yet.")
        raise
    return service(db=db, from_date=from_date, to_date=to_date)
