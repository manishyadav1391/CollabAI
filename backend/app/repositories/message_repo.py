from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.conversation import Conversation
from app.models.message import Message


def get_or_create_conversation(db: Session, project_id: str) -> Conversation:
    conv = db.query(Conversation).filter(Conversation.project_id == project_id).first()
    if conv:
        return conv
    conv = Conversation(project_id=project_id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def next_sequence_number(db: Session, conversation_id) -> int:
    max_seq = (
        db.query(func.max(Message.sequence_number))
        .filter(Message.conversation_id == conversation_id)
        .scalar()
    )
    return (max_seq or 0) + 1


def create_message(db: Session, conversation_id, sender_id, content: str) -> Message:
    seq = next_sequence_number(db, conversation_id)
    message = Message(
        conversation_id=conversation_id, sender_id=sender_id,
        content=content, sequence_number=seq,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def list_messages(db: Session, conversation_id, limit: int = 50) -> list[Message]:
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.sequence_number.desc())
        .limit(limit)
        .all()
    )