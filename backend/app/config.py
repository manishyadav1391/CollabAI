"""
Central application configuration.

Every environment variable the app needs is declared here, once, with a
type. Nothing else in the codebase should read os.environ directly —
import `settings` from this module instead. This keeps every config value
type-checked and gives you one place to see everything the app depends on.

See docs/04-technical-architecture.md §14.1 for the authoritative list of
required environment variables.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- App / environment ---
    environment: str = "local"  # local | production
    log_level: str = "INFO"

    # --- Database (required from Phase 1) ---
    database_url: str = "postgresql+asyncpg://collabai:collabai@localhost:5433/collabai"

    # --- Redis (required from Phase 3) ---
    redis_url: str = "redis://localhost:6379/0"

    # --- Auth / JWT (required from Phase 1) ---
    jwt_secret: str = "change-me-to-a-long-random-string"
    access_token_expiry_minutes: int = 15
    refresh_token_expiry_days: int = 30

    # --- Object storage (required from Phase 2) ---
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "collabai_minio"
    minio_secret_key: str = "change-me-minio-secret"
    minio_bucket: str = "collabai-documents"

    # --- AI / LLM (required from Phase 5) ---
    anthropic_api_key: str = ""
    embedding_model_name: str = "all-MiniLM-L6-v2"

    # --- Email (required from Phase 6) ---
    email_provider: str = ""  # resend | sendgrid | ses
    email_api_key: str = ""
    email_from_address: str = ""

    # --- Frontend ---
    frontend_base_url: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings instance. FastAPI route dependencies should use
    `Depends(get_settings)` rather than importing a module-level singleton,
    so tests can override it easily.
    """
    return Settings()


# Convenience singleton for non-DI contexts (e.g. worker scripts).
settings = get_settings()
