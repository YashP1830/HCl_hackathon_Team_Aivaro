from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.db.session import engine

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Library catalog, semantic recommendations, FAQ and research assistant APIs.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


@app.get("/", tags=["health"])
def root() -> dict[str, str]:
    return {"name": settings.app_name, "status": "running"}


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Liveness probe: confirms the application process is responsive."""
    return {"status": "ok"}


@app.get("/health/db", tags=["health"])
def database_health() -> dict[str, str]:
    """Readiness probe: checks that PostgreSQL is reachable."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        # Avoid returning connection details/secrets to callers.
        raise __import__("fastapi").HTTPException(
            status_code=503, detail="Database is unavailable"
        ) from exc
    return {"status": "ok", "database": "connected"}
