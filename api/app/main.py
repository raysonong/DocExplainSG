"""FastAPI application entrypoint for DocExplainSG.

Run (from the `api/` directory):
    uv run uvicorn app.main:app --reload

The backend is intentionally stateless: documents are processed in memory
and never persisted. See the project README for the full privacy stance.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import analyze, health

# Log only non-sensitive metadata. NEVER log document contents or extracted
# personal data (see README §Privacy).
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

settings = get_settings()

app = FastAPI(
    title=f"{settings.app_name} API",
    version="0.1.0",
    description=(
        "Plain-language explainer for Singapore government & financial "
        "documents. Stateless — uploads are processed in memory and discarded."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All routes are served under /api so the mobile client has a stable prefix.
app.include_router(health.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")


@app.get("/", tags=["meta"])
async def root() -> dict[str, str]:
    """Friendly root so hitting the base URL isn't a 404."""
    return {"name": settings.app_name, "docs": "/docs", "health": "/api/health"}
