from sqlalchemy.orm import Session

from app.models.ai_conversation import AIConversation
from app.models.ai_message import AIMessage


def create_conversation(db: Session, user_id, project_id: str) -> AIConversation:
    conversation = AIConversation(user_id=user_id, project_id=project_id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def get_conversation(db: Session, user_id, project_id: str, conversation_id: str) -> AIConversation | None:
    return (
        db.query(AIConversation)
        .filter(
            AIConversation.id == conversation_id,
            AIConversation.user_id == user_id,
            AIConversation.project_id == project_id,
        )
        .first()
    )


def list_conversations(db: Session, user_id, project_id: str) -> list[dict]:
    """One summary per conversation for the sidebar: titled by its first
    question, ordered by most recent activity. A conversation with no
    messages yet (shouldn't normally happen — created and abandoned before
    the first ask completed) is skipped, since there's nothing to title it."""
    conversations = (
        db.query(AIConversation)
        .filter(AIConversation.user_id == user_id, AIConversation.project_id == project_id)
        .all()
    )

    summaries = []
    for conversation in conversations:
        first_question = (
            db.query(AIMessage)
            .filter(AIMessage.conversation_id == conversation.id, AIMessage.role == "user")
            .order_by(AIMessage.created_at.asc())
            .first()
        )
        if not first_question:
            continue
        last_message = (
            db.query(AIMessage)
            .filter(AIMessage.conversation_id == conversation.id)
            .order_by(AIMessage.created_at.desc())
            .first()
        )
        summaries.append({
            "id": conversation.id,
            "title": first_question.content,
            "updated_at": last_message.created_at,
        })

    summaries.sort(key=lambda s: s["updated_at"], reverse=True)
    return summaries


def list_messages(db: Session, conversation_id, limit: int = 100) -> list[AIMessage]:
    return (
        db.query(AIMessage)
        .filter(AIMessage.conversation_id == conversation_id)
        .order_by(AIMessage.created_at.asc())
        .limit(limit)
        .all()
    )
