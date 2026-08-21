from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.conversation import Conversation
from app.models.conversation_participant import ConversationParticipant
from app.models.message import Message


def get_or_create_conversation(db: Session, project_id: str) -> Conversation:
    conv = (
        db.query(Conversation)
        .filter(Conversation.project_id == project_id, Conversation.kind == "room")
        .first()
    )
    if conv:
        return conv
    conv = Conversation(project_id=project_id, kind="room")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def get_or_create_dm_conversation(db: Session, project_id: str, user_a_id, user_b_id) -> Conversation:
    """Finds (or creates) the single DM conversation between exactly these
    two users within this project. Participant order doesn't matter."""
    existing = (
        db.query(Conversation)
        .join(ConversationParticipant, ConversationParticipant.conversation_id == Conversation.id)
        .filter(
            Conversation.project_id == project_id,
            Conversation.kind == "dm",
            ConversationParticipant.user_id.in_([user_a_id, user_b_id]),
        )
        .group_by(Conversation.id)
        .having(func.count(ConversationParticipant.user_id.distinct()) == 2)
        .first()
    )
    if existing:
        return existing

    conv = Conversation(project_id=project_id, kind="dm")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=user_a_id))
    db.add(ConversationParticipant(conversation_id=conv.id, user_id=user_b_id))
    db.commit()
    return conv


def list_dm_threads(db: Session, project_id: str, user_id) -> list[dict]:
    """DM conversations in this project that `user_id` participates in, each
    with the other participant's id and the most recent message (if any)."""
    my_conversation_ids = (
        db.query(ConversationParticipant.conversation_id)
        .join(Conversation, Conversation.id == ConversationParticipant.conversation_id)
        .filter(Conversation.project_id == project_id, Conversation.kind == "dm", ConversationParticipant.user_id == user_id)
        .subquery()
    )

    other_participants = (
        db.query(ConversationParticipant)
        .filter(
            ConversationParticipant.conversation_id.in_(my_conversation_ids),
            ConversationParticipant.user_id != user_id,
        )
        .all()
    )

    results = []
    for participant in other_participants:
        last_message = (
            db.query(Message)
            .filter(Message.conversation_id == participant.conversation_id)
            .order_by(Message.sequence_number.desc())
            .first()
        )
        results.append({
            "conversation_id": participant.conversation_id,
            "other_user_id": participant.user_id,
            "last_message": last_message.content if last_message else None,
            "last_message_at": last_message.created_at if last_message else None,
        })
    return results


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