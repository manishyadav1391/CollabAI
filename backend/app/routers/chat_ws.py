"""
Real-time chat over WebSocket. Per docs/05-security-compliance.md §9:
the connection is authenticated and project-membership is verified
BEFORE the connection is accepted — never after.
"""

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis

from app.config import get_settings
from app.core.db import SessionLocal
from app.core.security import decode_access_token
from app.models.workspace_member import WorkspaceMember
from app.models.project import Project
from app.services import chat_service

router = APIRouter()
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
    finally:
        db.close()

    await websocket.accept()

    redis_conn = aioredis.from_url(settings.redis_url)
    pubsub = redis_conn.pubsub()
    await pubsub.subscribe(chat_service.channel_name(project_id))

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
                message_data = chat_service.persist_message(db, project_id, user_id, content)
            finally:
                db.close()

            await chat_service.publish(project_id, message_data)

    except WebSocketDisconnect:
        pass
    finally:
        forward_task.cancel()
        await pubsub.unsubscribe(chat_service.channel_name(project_id))
        await redis_conn.close()


from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.user import User

history_router = APIRouter()


@history_router.get("/chat/{project_id}/history")
def get_history(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not _is_project_member(db, current_user.id, project_id):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not a member of this project")
    return {"messages": chat_service.get_history(db, project_id)}
