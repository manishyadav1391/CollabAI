"""
Simple Redis-backed rate limiter (NFR-09, docs/05-security-compliance.md §3/§8).
A fixed-window counter is enough for v1's single-instance deployment —
not sophisticated distributed rate limiting, which isn't needed yet.
"""

from fastapi import HTTPException
from app.core.queue import redis_conn


def check_rate_limit(key: str, max_requests: int, window_seconds: int) -> None:
    full_key = f"ratelimit:{key}"
    current = redis_conn.incr(full_key)
    if current == 1:
        redis_conn.expire(full_key, window_seconds)
    if current > max_requests:
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")