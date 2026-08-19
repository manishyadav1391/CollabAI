"""
FastAPI application entrypoint.

Phase 0: just app startup, logging, CORS, and /health.
Routers get included here as each phase adds them — see
docs/08-implementation-build-guide.md §5 for the build order
(Phase 1 adds auth/workspaces/projects, Phase 2 adds documents, etc.).
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.core.logging import RequestIdMiddleware, configure_logging
from app.core import storage
from app import models

settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger("collabai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("CollabAI API starting up (environment=%s)", settings.environment)
    storage.ensure_bucket_exists()
    yield
    logger.info("CollabAI API shutting down")


app = FastAPI(
    title="CollabAI API",
    version="0.1.0",
    description="AI collaborative workspace — backend API (v1, single-VM build).",
    lifespan=lifespan,
)

# Request-ID propagation must be added before other middleware that logs.
app.add_middleware(RequestIdMiddleware)

# CORS: restricted to the real frontend origin (docs/05-security-compliance.md §8).
# In local dev this is the Next.js dev server; tighten this list before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_base_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
async def health() -> dict:
    """
    Liveness/readiness check.

    Phase 0 definition of done (docs/06-project-planning.md §4) requires
    this endpoint to return 200 with `docker-compose up` running.
    """
    return {"status": "ok", "service": "collabai-api", "version": "0.1.0"}


from app.routers import auth, workspaces, projects ,documents

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
app.include_router(projects.router, tags=["projects"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])