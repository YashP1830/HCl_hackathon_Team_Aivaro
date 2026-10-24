from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.dependencies import get_db, require_admin
from backend.app.models.user import User
from backend.app.analytics.analytics_service import AnalyticsService

router = APIRouter(prefix="/admin", tags=["Admin Analytics"])
analytics_service = AnalyticsService()

@router.get("/analytics", response_model=Dict[str, Any])
def get_purchase_analytics(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return analytics_service.generate_report(db, start_date=from_date, end_date=to_date)
