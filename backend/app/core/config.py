from functools import lru_cache
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_env: str = "development"
    app_name: str = "AI-Powered Library & Research Assistant"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/library_assistant"
    jwt_secret_key: str = "development-only-change-this-secret"
    access_token_expire_minutes: int = Field(default=60, gt=0, le=1440)
    frontend_origin: str = "http://localhost:5173"
    llm_api_key: str | None = None
    llm_model: str | None = None
    embedding_model: str | None = None
    embedding_dimension: int | None = None
    serpapi_api_key: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    email_from: str | None = None
    support_email: str | None = None

    @model_validator(mode="after")
    def require_production_secret(self):
        if self.app_env.lower() in {"production", "prod"} and (
            self.jwt_secret_key == "development-only-change-this-secret"
            or "replace-with" in self.jwt_secret_key.lower()
            or len(self.jwt_secret_key) < 32
        ):
            raise ValueError("Production requires a JWT_SECRET_KEY of at least 32 characters.")
        return self

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8",
        case_sensitive=False, extra="ignore",
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()
