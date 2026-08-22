"""
FastAPI application entrypoint.

Phase 0: just app startup, logging, CORS, and /health.
Routers get included here as each phase adds them — see
docs/08-implementation-build-guide.md §5 for the build order
(Phase 1 adds auth/workspaces/projects, Phase 2 adds documents, etc.).
"""

import logging
import subprocess
import sys
import threading
import time
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


class EmbeddedWorkerSupervisor:
    """
    Runs `python -m app.workers.worker_main` as a child process of the API,
    restarting it if it dies. Used on hosts (e.g. FastAPI Cloud) that only
    deploy one process — see `settings.enable_embedded_worker`.

    Deliberately a subprocess, not an in-process thread: RQ's `Worker.work()`
    installs SIGINT/SIGTERM handlers unconditionally, which only works on a
    process's main thread, and running document-processing jobs in a plain
    thread would mean a crash there could take the whole API down with it.
    """

    RESTART_DELAY_SECONDS = 2

    def __init__(self):
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._proc: subprocess.Popen | None = None

    def start(self):
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()
        if self._proc is not None:
            self._proc.terminate()
        if self._thread is not None:
            self._thread.join(timeout=10)

    def _run(self):
        while not self._stop.is_set():
            logger.info("embedded worker: starting app.workers.worker_main")
            self._proc = subprocess.Popen([sys.executable, "-m", "app.workers.worker_main"])
            exit_code = self._proc.wait()
            if self._stop.is_set():
                break
            logger.warning(
                "embedded worker: exited with code %s, restarting in %ss",
                exit_code,
                self.RESTART_DELAY_SECONDS,
            )
            time.sleep(self.RESTART_DELAY_SECONDS)


_worker_supervisor: EmbeddedWorkerSupervisor | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _worker_supervisor
    logger.info("CollabAI API starting up (environment=%s)", settings.environment)
    storage.ensure_bucket_exists()
    if settings.enable_embedded_worker:
        _worker_supervisor = EmbeddedWorkerSupervisor()
        _worker_supervisor.start()
    yield
    if _worker_supervisor is not None:
        _worker_supervisor.stop()
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


from app.routers import auth, workspaces, projects, documents, folders, search, ai, notifications, chat_ws, comments
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
app.include_router(projects.router, tags=["projects"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(folders.router, prefix="/folders", tags=["folders"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(chat_ws.router, prefix="/ws", tags=["chat"])
app.include_router(chat_ws.history_router, prefix="/ws", tags=["chat"])
app.include_router(comments.router, tags=["comments"])