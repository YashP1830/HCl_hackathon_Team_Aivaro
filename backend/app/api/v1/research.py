from fastapi import APIRouter
from backend.app.schemas.research import ResearchRequest, ResearchResponse
from backend.app.ai.services.research_service import ResearchService

router = APIRouter(prefix="/research", tags=["Research"])

@router.post("/search", response_model=ResearchResponse)
def search_research_papers(req: ResearchRequest):
    return ResearchService.search_scholar(topic=req.topic, max_results=req.max_results)
