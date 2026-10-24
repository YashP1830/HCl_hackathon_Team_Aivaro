from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.api.deps import get_current_user, require_admin
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
    _user: User = Depends(get_current_user),
) -> RecommendationResponse:
    # Replace this explicit stub when Member C's service signature is agreed and merged.
    raise HTTPException(
        status_code=_SERVICE_UNAVAILABLE,
        detail="Recommendation service is not integrated yet.",
    )


@router.post("/chat/faq", response_model=FAQResponse)
def answer_faq(
    payload: FAQRequest,
    _user: User = Depends(get_current_user),
) -> FAQResponse:
    raise HTTPException(
        status_code=_SERVICE_UNAVAILABLE,
        detail="FAQ service is not integrated yet.",
    )


@router.post("/research/search", response_model=ResearchResponse)
def search_research(
    payload: ResearchRequest,
    _user: User = Depends(get_current_user),
) -> ResearchResponse:
    raise HTTPException(
        status_code=_SERVICE_UNAVAILABLE,
        detail="Research service is not integrated yet.",
    )


@router.get("/admin/analytics", response_model=AnalyticsResponse)
def get_admin_analytics(
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    _admin: User = Depends(require_admin),
) -> AnalyticsResponse:
    if to_date < from_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The 'to' date must be on or after the 'from' date.",
        )
    raise HTTPException(
        status_code=_SERVICE_UNAVAILABLE,
        detail="Analytics service is not integrated yet.",
    )
