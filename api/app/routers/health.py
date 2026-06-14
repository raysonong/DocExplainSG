"""Liveness / readiness endpoint."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import get_settings

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    # True when an Anthropic API key is configured. Does NOT expose the key.
    llm_configured: bool


@router.get("/health", response_model=HealthResponse, tags=["meta"])
async def health() -> HealthResponse:
    """Simple liveness check. Reports whether the LLM is configured."""
    from app import __version__

    settings = get_settings()
    return HealthResponse(
        status="ok",
        app=settings.app_name,
        version=__version__,
        llm_configured=bool(settings.anthropic_api_key),
    )
