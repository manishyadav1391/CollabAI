"""
Structured logging setup + request-ID propagation.

Every log line includes a request_id so a single request's path through
the system is traceable (NFR-10, docs/04-technical-architecture.md §14
and docs/05-security-compliance.md §13 — never log secrets here).
"""

import logging
import sys
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Holds the current request's ID so any log call in this request's
# lifecycle can pick it up without threading it through every function.
_request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


class RequestIdFilter(logging.Filter):
    """Injects the current request ID into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = _request_id_ctx.get()
        return True


def configure_logging(log_level: str = "INFO") -> None:
    """Call once at app startup (see app/main.py)."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s %(levelname)s [request_id=%(request_id)s] %(name)s: %(message)s"
        )
    )
    handler.addFilter(RequestIdFilter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(log_level)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Generates a request ID per request and makes it available to logging
    and to the client (as a response header, useful for debugging)."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())
        token = _request_id_ctx.set(request_id)
        try:
            response = await call_next(request)
        finally:
            _request_id_ctx.reset(token)
        response.headers["X-Request-ID"] = request_id
        return response
