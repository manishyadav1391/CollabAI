"""
Message persistence + Redis pub/sub fan-out.
docs/04-technical-architecture.md §11: even at single-instance scale,
publishing through Redis (rather than an in-memory list of connections)
is what makes this trivially extensible to multiple WebSocket processes
later, with zero code change to this file.
"""

import json

import redis.asyncio as aioredis
from sqlalchemy.orm import Session

from app.config import get_settings
from app.repositories import message_repo

settings = get_settings()
_async_redis = aioredis.from_url(settings.redis_url)


def channel_name(project_id: str) -> str:
    return f"chat:{project_id}"


def persist_message(db: Session, project_id: str, sender_id, content: str) -> dict:
    conversation = message_repo.get_or_create_conversation(db, project_id)
    message = message_repo.create_message(db, conversation.id, sender_id, content)
    return {
        "id": str(message.id),
        "sender_id": str(message.sender_id),
        "content": message.content,
        "sequence_number": message.sequence_number,
        "created_at": message.created_at.isoformat(),
    }


async def publish(project_id: str, message_data: dict) -> None:
    await _async_redis.publish(channel_name(project_id), json.dumps(message_data))


def get_history(db: Session, project_id: str, limit: int = 50) -> list[dict]:
    conversation = message_repo.get_or_create_conversation(db, project_id)
    messages = message_repo.list_messages(db, conversation.id, limit)
    return [
        {
            "id": str(m.id),
            "sender_id": str(m.sender_id),
            "content": m.content,
            "sequence_number": m.sequence_number,
            "created_at": m.created_at.isoformat(),
        }
        for m in reversed(messages)  # oldest first for display
    ]