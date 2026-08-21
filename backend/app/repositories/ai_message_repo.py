from sqlalchemy.orm import Session

from app.models.ai_conversation import AIConversation
from app.models.ai_message import AIMessage


def get_or_create_ai_conversation(db: Session, user_id, project_id: str) -> AIConversation:
    conversation = (
        db.query(AIConversation)
        .filter(AIConversation.user_id == user_id, AIConversation.project_id == project_id)
        .first()
    )
    if conversation:
        return conversation
    conversation = AIConversation(user_id=user_id, project_id=project_id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def list_history(db: Session, user_id, project_id: str, limit: int = 50) -> list[AIMessage]:
    return (
        db.query(AIMessage)
        .join(AIConversation, AIConversation.id == AIMessage.conversation_id)
        .filter(AIConversation.user_id == user_id, AIConversation.project_id == project_id)
        .order_by(AIMessage.created_at.desc())
        .limit(limit)
        .all()[::-1]
    )
