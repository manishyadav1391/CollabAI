"""
Custom exceptions, caught centrally in app/main.py and mapped to HTTP
responses. Services raise these instead of HTTPException directly, so
business logic doesn't depend on FastAPI (docs/07-development-standards.md §8).
"""


class AppError(Exception):
    """Base class for all custom application exceptions."""


class NotFoundError(AppError):
    pass


class PermissionDeniedError(AppError):
    pass


class ValidationError(AppError):
    pass


class RateLimitedError(AppError):
    pass