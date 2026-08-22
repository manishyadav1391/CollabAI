from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.deps import get_current_user
from app.core.permission_filter import can_access_project
from app.models.user import User
from app.models.workspace_member import WorkspaceMember
from app.schemas.ai import AskRequest, AIMessageResponse, ConversationSummary
from app.services import ai_service
from app.core.rate_limit import check_rate_limit

router = APIRouter()


def _require_membership(db: Session, workspace_id: str, user_id) -> None:
    membership = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")


@router.post("/ask")
def ask(
    payload: AskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if bool(payload.project_id) == bool(payload.workspace_id):
        raise HTTPException(status_code=400, detail="Provide exactly one of project_id or workspace_id")

    if payload.workspace_id:
        _require_membership(db, payload.workspace_id, current_user.id)
    elif not can_access_project(db, current_user.id, payload.project_id):
        raise HTTPException(status_code=403, detail="Not permitted to view this project")

    check_rate_limit(f"ai_ask:user:{current_user.id}", max_requests=30, window_seconds=3600)

    if payload.conversation_id:
        conversation = ai_service.get_conversation(
            db, current_user.id, payload.project_id, payload.workspace_id, payload.conversation_id
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = ai_service.start_conversation(db, current_user.id, payload.project_id, payload.workspace_id)

    return StreamingResponse(
        ai_service.ask_stream(
            db, current_user.id, payload.project_id, payload.workspace_id, payload.question, conversation.id
        ),
        media_type="text/event-stream",
    )


@router.get("/conversations", response_model=list[ConversationSummary])
def list_conversations(
    project_id: str | None = None,
    workspace_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if bool(project_id) == bool(workspace_id):
        raise HTTPException(status_code=400, detail="Provide exactly one of project_id or workspace_id")

    if project_id:
        if not can_access_project(db, current_user.id, project_id):
            raise HTTPException(status_code=403, detail="Not permitted to view this project")
    else:
        _require_membership(db, workspace_id, current_user.id)

    return ai_service.list_conversations(db, current_user.id, project_id, workspace_id)


@router.get("/conversations/{conversation_id}/messages", response_model=list[AIMessageResponse])
def get_conversation_messages(
    conversation_id: str,
    project_id: str | None = None,
    workspace_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = ai_service.get_conversation(db, current_user.id, project_id, workspace_id, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ai_service.get_messages(db, conversation.id)
