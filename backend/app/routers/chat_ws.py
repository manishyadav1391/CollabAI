"""
Real-time chat over WebSocket. Per docs/05-security-compliance.md §9:
the connection is authenticated and project-membership is verified
BEFORE the connection is accepted — never after.
"""

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.db import SessionLocal, get_db
from app.core.deps import get_current_user
from app.core.security import decode_access_token
from app.core import presence
from app.models.workspace_member import WorkspaceMember
from app.models.project import Project
from app.models.user import User
from app.repositories import conversation_read_repo, message_repo
from app.services import chat_service

router = APIRouter()
history_router = APIRouter()
settings = get_settings()


def _is_project_member(db, user_id, project_id) -> bool:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return False
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == project.workspace_id,
        WorkspaceMember.user_id == user_id,
    ).first()
    return membership is not None


async def _relay(websocket: WebSocket, conversation_id, user_id):
    """Shared connect/relay loop for both the project room and DM sockets,
    once the caller has resolved the conversation and verified access."""
    redis_conn = aioredis.from_url(settings.redis_url)
    pubsub = redis_conn.pubsub()
    # Subscribe BEFORE accepting the connection — otherwise a sender could
    # finish connecting and publish before we're actually listening, and
    # Redis pub/sub has no delivery guarantee for a not-yet-subscribed
    # channel, silently dropping the message.
    await pubsub.subscribe(chat_service.channel_name(conversation_id))

    await websocket.accept()

    async def forward_from_redis():
        async for msg in pubsub.listen():
            if msg["type"] == "message":
                await websocket.send_text(msg["data"].decode())

    forward_task = asyncio.create_task(forward_from_redis())

    try:
        while True:
            raw = await websocket.receive_text()
            content = json.loads(raw)["content"]

            db = SessionLocal()
            try:
                message_data = chat_service.persist_message(db, conversation_id, user_id, content)
                await chat_service.publish(conversation_id, message_data)
                await chat_service.notify_new_message(db, conversation_id, message_data, user_id)
            finally:
                db.close()

    except WebSocketDisconnect:
        pass
    finally:
        forward_task.cancel()
        await pubsub.unsubscribe(chat_service.channel_name(conversation_id))
        await redis_conn.close()


@router.websocket("/chat/{project_id}")
async def chat_websocket(websocket: WebSocket, project_id: str, token: str):
    user_id = decode_access_token(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    db = SessionLocal()
    try:
        if not _is_project_member(db, user_id, project_id):
            await websocket.close(code=4003)
            return
        conversation_id = chat_service.get_or_create_room(db, project_id).id
    finally:
        db.close()

    await _relay(websocket, conversation_id, user_id)


@router.websocket("/notifications")
async def notifications_websocket(websocket: WebSocket, token: str):
    """One live channel per user for the notification bell — no project
    scoping needed, every user may listen to their own `notify:{user_id}`
    channel (see chat_service.notify_new_message)."""
    user_id = decode_access_token(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    redis_conn = aioredis.from_url(settings.redis_url)
    pubsub = redis_conn.pubsub()
    await pubsub.subscribe(chat_service.notify_channel_name(user_id), presence.PRESENCE_UPDATES_CHANNEL)

    await websocket.accept()
    # This socket is mounted app-wide (the notification bell), so it's the
    # heartbeat FR-CHAT-04's online/offline indicator is built on.
    await presence.connect(user_id)

    async def forward_from_redis():
        async for msg in pubsub.listen():
            if msg["type"] == "message":
                await websocket.send_text(msg["data"].decode())

    async def refresh_presence_periodically():
        while True:
            await asyncio.sleep(presence.PRESENCE_REFRESH_SECONDS)
            await presence.refresh(user_id)

    forward_task = asyncio.create_task(forward_from_redis())
    refresh_task = asyncio.create_task(refresh_presence_periodically())
    try:
        while True:
            await websocket.receive_text()  # unused, just detects disconnect
    except WebSocketDisconnect:
        pass
    finally:
        forward_task.cancel()
        refresh_task.cancel()
        await presence.disconnect(user_id)
        await pubsub.unsubscribe(chat_service.notify_channel_name(user_id), presence.PRESENCE_UPDATES_CHANNEL)
        await redis_conn.close()


@router.websocket("/dm/{project_id}/{other_user_id}")
async def dm_websocket(websocket: WebSocket, project_id: str, other_user_id: str, token: str):
    user_id = decode_access_token(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    db = SessionLocal()
    try:
        if not _is_project_member(db, user_id, project_id) or not _is_project_member(db, other_user_id, project_id):
            await websocket.close(code=4003)
            return
        conversation_id = chat_service.get_or_create_dm(db, project_id, user_id, other_user_id).id
    finally:
        db.close()

    await _relay(websocket, conversation_id, user_id)


@history_router.get("/chat/{project_id}/history")
def get_history(
    project_id: str,
    before: int | None = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_project_member(db, current_user.id, project_id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    conversation = chat_service.get_or_create_room(db, project_id)
    return chat_service.get_history(db, conversation.id, limit=limit, before_sequence=before)


@history_router.get("/chat/{project_id}/dm-threads")
def get_dm_threads(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_project_member(db, current_user.id, project_id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    threads = chat_service.list_dm_threads(db, project_id, current_user.id)
    read_map = conversation_read_repo.get_last_read_map(
        db, [t["conversation_id"] for t in threads], current_user.id
    )
    return {
        "threads": [
            {
                "conversation_id": str(t["conversation_id"]),
                "other_user_id": str(t["other_user_id"]),
                "last_message": t["last_message"],
                "last_message_at": t["last_message_at"].isoformat() if t["last_message_at"] else None,
                "unread_count": message_repo.count_unread(
                    db, t["conversation_id"], read_map.get(t["conversation_id"], 0), exclude_sender_id=current_user.id
                ),
            }
            for t in threads
        ]
    }


@history_router.get("/chat/{project_id}/dm/{other_user_id}/history")
def get_dm_history(
    project_id: str,
    other_user_id: str,
    before: int | None = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_project_member(db, current_user.id, project_id) or not _is_project_member(db, other_user_id, project_id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    conversation = chat_service.get_or_create_dm(db, project_id, current_user.id, other_user_id)
    result = chat_service.get_history(db, conversation.id, limit=limit, before_sequence=before)

    other_read = conversation_read_repo.get(db, conversation.id, other_user_id)
    other_last_seq = other_read.last_read_sequence_number if other_read else 0
    for m in result["messages"]:
        m["read"] = m["sequence_number"] <= other_last_seq

    return result


@history_router.put("/chat/{project_id}/read")
async def mark_room_read(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_project_member(db, current_user.id, project_id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    conversation = chat_service.get_or_create_room(db, project_id)
    await _mark_read_and_notify(db, conversation.id, current_user.id)
    return {"status": "marked read"}


@history_router.put("/chat/{project_id}/dm/{other_user_id}/read")
async def mark_dm_read(
    project_id: str,
    other_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_project_member(db, current_user.id, project_id) or not _is_project_member(db, other_user_id, project_id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    conversation = chat_service.get_or_create_dm(db, project_id, current_user.id, other_user_id)
    await _mark_read_and_notify(db, conversation.id, current_user.id)
    return {"status": "marked read"}


async def _mark_read_and_notify(db: Session, conversation_id, user_id) -> None:
    latest = message_repo.list_messages(db, conversation_id, limit=1)
    latest_seq = latest[0].sequence_number if latest else 0
    chat_service.mark_read(db, conversation_id, user_id, latest_seq)
    await chat_service.publish(
        conversation_id, {"type": "read_receipt", "user_id": str(user_id), "up_to_sequence": latest_seq}
    )
