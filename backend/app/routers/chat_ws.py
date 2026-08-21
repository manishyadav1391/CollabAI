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
from app.models.workspace_member import WorkspaceMember
from app.models.project import Project
from app.models.user import User
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
            finally:
                db.close()

            await chat_service.publish(conversation_id, message_data)

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_project_member(db, current_user.id, project_id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    conversation = chat_service.get_or_create_room(db, project_id)
    return {"messages": chat_service.get_history(db, conversation.id)}


@history_router.get("/chat/{project_id}/dm-threads")
def get_dm_threads(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_project_member(db, current_user.id, project_id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    threads = chat_service.list_dm_threads(db, project_id, current_user.id)
    return {
        "threads": [
            {
                "conversation_id": str(t["conversation_id"]),
                "other_user_id": str(t["other_user_id"]),
                "last_message": t["last_message"],
                "last_message_at": t["last_message_at"].isoformat() if t["last_message_at"] else None,
            }
            for t in threads
        ]
    }


@history_router.get("/chat/{project_id}/dm/{other_user_id}/history")
def get_dm_history(
    project_id: str,
    other_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_project_member(db, current_user.id, project_id) or not _is_project_member(db, other_user_id, project_id):
        raise HTTPException(status_code=403, detail="Not a member of this project")
    conversation = chat_service.get_or_create_dm(db, project_id, current_user.id, other_user_id)
    return {"messages": chat_service.get_history(db, conversation.id)}
