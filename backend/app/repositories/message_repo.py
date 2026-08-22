from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.conversation import Conversation
from app.models.conversation_participant import ConversationParticipant
from app.models.message import Message
from app.models.project import Project
from app.models.workspace_member import WorkspaceMember


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


def list_messages(db: Session, conversation_id, limit: int = 50, before_sequence: int | None = None) -> list[Message]:
    query = db.query(Message).filter(Message.conversation_id == conversation_id)
    if before_sequence is not None:
        query = query.filter(Message.sequence_number < before_sequence)
    return query.order_by(Message.sequence_number.desc()).limit(limit).all()


def count_unread(db: Session, conversation_id, after_sequence: int, exclude_sender_id=None) -> int:
    """Messages after this user's read cursor, excluding their own sent
    messages (sending a message doesn't leave it "unread" for yourself)."""
    query = db.query(func.count(Message.id)).filter(
        Message.conversation_id == conversation_id, Message.sequence_number > after_sequence
    )
    if exclude_sender_id is not None:
        query = query.filter(Message.sender_id != exclude_sender_id)
    return query.scalar() or 0


def list_room_recipients(db: Session, conversation_id, sender_id) -> list:
    """Every workspace member of the project this room conversation belongs
    to, except the sender — mirrors the membership check `_is_project_member`
    in chat_ws.py uses to grant room access in the first place."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        return []
    project = db.query(Project).filter(Project.id == conversation.project_id).first()
    if not project:
        return []
    members = (
        db.query(WorkspaceMember.user_id)
        .filter(WorkspaceMember.workspace_id == project.workspace_id, WorkspaceMember.user_id != sender_id)
        .all()
    )
    return [m.user_id for m in members]