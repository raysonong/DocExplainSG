"""Application configuration, loaded from environment variables / .env.

All settings are read once at startup via a cached `get_settings()`.
Secrets (the Gemini API key) are never hardcoded — they come from the
environment only.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings.

    Values are sourced from environment variables, falling back to a local
    `.env` file (see `.env.example`). Field names map to env vars
    case-insensitively, e.g. `GEMINI_MODEL` -> `gemini_model`.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- App metadata ---
    app_name: str = "DocExplainSG"

    # --- Gemini ---
    # Optional at boot so that /health works without a key configured.
    # Phase 2 endpoints will require it and fail with a clear error if missing.
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.5-flash"

    # --- Upload limits ---
    max_upload_mb: int = 20
    max_files: int = 10

    # --- CORS ---
    # Comma-separated origins, or "*" for any.
    cors_origins: str = "*"

    # --- Server ---
    host: str = "0.0.0.0"
    port: int = 8000

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return the cached Settings singleton."""
    return Settings()
