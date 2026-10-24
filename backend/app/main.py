from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.core.config import settings
from backend.app.db.session import engine, Base
from backend.app.api.v1 import (
    auth as auth_router,
    books as books_router,
    recommendations as rec_router,
    faq as faq_router,
    research as research_router,
    loans as loans_router,
    analytics as analytics_router
)

# Auto-create tables if running in dev without alembic
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Library & Research Assistant",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global consistent error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc)
            },
            "request_id": request.headers.get("x-request-id", "req-unknown")
        }
    )

# Health endpoint
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "app_env": settings.APP_ENV}

# Router inclusion
app.include_router(auth_router.router, prefix=settings.API_PREFIX)
app.include_router(books_router.router, prefix=settings.API_PREFIX)
app.include_router(rec_router.router, prefix=settings.API_PREFIX)
app.include_router(faq_router.router, prefix=settings.API_PREFIX)
app.include_router(research_router.router, prefix=settings.API_PREFIX)
app.include_router(loans_router.router, prefix=settings.API_PREFIX)
app.include_router(analytics_router.router, prefix=settings.API_PREFIX)
