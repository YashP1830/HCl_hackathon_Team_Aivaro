from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI-Powered Library and Research Assistant"
    environment: str = "local"
    api_v1_prefix: str = "/api/v1"

    database_url: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/library_assistant"
    )

    jwt_secret_key: str = "replace-with-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    embedding_model: str = "replace-with-your-embedding-model"
    embedding_dimension: int = 1536
    llm_model: str = "replace-with-your-llm-model"
    llm_api_key: str | None = None

    serpapi_api_key: str | None = None

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    support_email: str | None = None
    app_timezone: str = "Asia/Kolkata"
    overdue_check_cron: str = "0 9 * * *"
    purchase_log_path: str = "./data/purchase_logs.csv"
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
