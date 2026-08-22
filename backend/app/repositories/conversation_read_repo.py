from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.conversation_read import ConversationRead


def get(db: Session, conversation_id, user_id) -> ConversationRead | None:
    return (
        db.query(ConversationRead)
        .filter(ConversationRead.conversation_id == conversation_id, ConversationRead.user_id == user_id)
        .first()
    )


def mark_read(db: Session, conversation_id, user_id, up_to_sequence: int) -> None:
    """Moves this user's read cursor forward to `up_to_sequence` — never
    backward, so re-opening an older message can't un-read newer ones."""
    row = get(db, conversation_id, user_id)
    if row is None:
        row = ConversationRead(
            conversation_id=conversation_id, user_id=user_id,
            last_read_sequence_number=up_to_sequence,
        )
        db.add(row)
    elif up_to_sequence > row.last_read_sequence_number:
        row.last_read_sequence_number = up_to_sequence
        row.updated_at = datetime.now(timezone.utc)
    db.commit()


def get_last_read_map(db: Session, conversation_ids, user_id) -> dict:
    if not conversation_ids:
        return {}
    rows = (
        db.query(ConversationRead)
        .filter(ConversationRead.conversation_id.in_(conversation_ids), ConversationRead.user_id == user_id)
        .all()
    )
    return {row.conversation_id: row.last_read_sequence_number for row in rows}
