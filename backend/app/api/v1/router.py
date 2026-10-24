from fastapi import APIRouter
from app.api.v1.routes import auth, books, loans

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(books.router)
api_router.include_router(loans.router)
