import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str = "development"
    API_PREFIX: str = "/api/v1"
    DATABASE_URL: str = "postgresql+psycopg://user:password@localhost:5432/library_assistant"
    SECRET_KEY: str = "temporary-secret-key-for-development"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    SUPPORT_EMAIL: str = "support@library.example.com"
    EMBEDDING_DIMENSION: int = 1536

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
