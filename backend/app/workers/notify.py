"""
Async notification delivery job (FR-NOTIF-02): creates the DB row (and
sends an email for high-signal types, see notification_service's
EMAIL_WORTHY_TYPES), then pushes a live update over the recipient's
`notify:{user_id}` Redis channel for the notification bell.

Runs in the RQ worker process — callers (comment mentions, project
adds, document uploads, chat messages, processing results) enqueue via
notification_service.enqueue_notification and never block on this.
"""

import json

import redis

from app.config import get_settings
from app.core.db import SessionLocal
from app.services import notification_service

settings = get_settings()
_redis = redis.from_url(settings.redis_url)


def send_notification(user_id: str, type_: str, payload: dict) -> None:
    db = SessionLocal()
    try:
        notif = notification_service.create_notification(db, user_id, type_, payload)
        _redis.publish(
            f"notify:{user_id}",
            json.dumps({
                **notif,
                "created_at": notif["created_at"].isoformat() if notif["created_at"] else None,
                "read_at": notif["read_at"].isoformat() if notif["read_at"] else None,
            }, default=str),
        )
    finally:
        db.close()
