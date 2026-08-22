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
from app.models.conversation import Conversation
from app.models.conversation_participant import ConversationParticipant
from app.models.project import Project
from app.repositories import conversation_read_repo, message_repo
from app.services import notification_service

settings = get_settings()
_async_redis = aioredis.from_url(settings.redis_url)


def channel_name(conversation_id) -> str:
    return f"chat:{conversation_id}"


def notify_channel_name(user_id) -> str:
    return f"notify:{user_id}"


def get_or_create_room(db: Session, project_id: str):
    return message_repo.get_or_create_conversation(db, project_id)


def get_or_create_dm(db: Session, project_id: str, user_a_id, user_b_id):
    return message_repo.get_or_create_dm_conversation(db, project_id, user_a_id, user_b_id)


def list_dm_threads(db: Session, project_id: str, user_id) -> list[dict]:
    return message_repo.list_dm_threads(db, project_id, user_id)


def persist_message(db: Session, conversation_id, sender_id, content: str) -> dict:
    message = message_repo.create_message(db, conversation_id, sender_id, content)
    return {
        "id": str(message.id),
        "sender_id": str(message.sender_id),
        "content": message.content,
        "sequence_number": message.sequence_number,
        "created_at": message.created_at.isoformat(),
    }


async def publish(conversation_id, message_data: dict) -> None:
    await _async_redis.publish(channel_name(conversation_id), json.dumps(message_data))


def mark_read(db: Session, conversation_id, user_id, up_to_sequence: int) -> None:
    conversation_read_repo.mark_read(db, conversation_id, user_id, up_to_sequence)


async def notify_new_message(db: Session, conversation_id, message_data: dict, sender_id) -> None:
    """Creates a `new_message` notification for everyone but the sender —
    the other DM participant, or every other workspace member for a room
    conversation — and pushes it live over that user's `notify:{user_id}`
    Redis channel (see the `/ws/notifications` WebSocket in chat_ws.py).

    Takes `conversation_id` (not a `Conversation` instance) and re-queries
    it fresh against the caller's own (open) session — the conversation
    handed back by get_or_create_room/get_or_create_dm may belong to a
    session that's already been closed by the time a message is sent, and
    its attributes are commonly expired (a fresh DM commits participant
    rows after the conversation row, re-expiring it), which raises
    DetachedInstanceError the moment they're touched here."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        return

    if conversation.kind == "dm":
        recipients = [
            p.user_id
            for p in db.query(ConversationParticipant)
            .filter(ConversationParticipant.conversation_id == conversation.id, ConversationParticipant.user_id != sender_id)
            .all()
        ]
    else:
        recipients = message_repo.list_room_recipients(db, conversation.id, sender_id)

    if not recipients:
        return

    project = db.query(Project).filter(Project.id == conversation.project_id).first()
    content = message_data["content"]
    payload = {
        "conversation_id": str(conversation.id),
        "project_id": str(conversation.project_id),
        "workspace_id": str(project.workspace_id) if project else None,
        "kind": conversation.kind,
        "sender_id": str(sender_id),
        "preview": content[:120],
    }

    for recipient_id in recipients:
        notification_service.enqueue_notification(recipient_id, "new_message", payload)


def get_history(db: Session, conversation_id, limit: int = 50, before_sequence: int | None = None) -> dict:
    # Fetch one extra row to know whether an older page exists, without a
    # separate COUNT query.
    rows = message_repo.list_messages(db, conversation_id, limit + 1, before_sequence)
    has_more = len(rows) > limit
    page = rows[:limit]

    messages = [
        {
            "id": str(m.id),
            "sender_id": str(m.sender_id),
            "content": m.content,
            "sequence_number": m.sequence_number,
            "created_at": m.created_at.isoformat(),
        }
        for m in reversed(page)  # oldest first for display
    ]
    return {"messages": messages, "has_more": has_more}