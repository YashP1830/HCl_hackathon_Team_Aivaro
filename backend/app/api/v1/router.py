from fastapi import APIRouter
from app.api.v1.routes import auth, books, loans, service_stubs

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(books.router)
api_router.include_router(loans.router)
api_router.include_router(service_stubs.router)
