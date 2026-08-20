from sqlalchemy.orm import Session

from app.repositories import notification_repo, user_repo
from app.services.email_service import send_email

# Only these notification types also trigger an email — avoids spamming
# users for every minor event (docs/04-technical-architecture.md §12).
EMAIL_WORTHY_TYPES = {"processing_failed", "added_to_project"}


def create_notification(db: Session, user_id, type_: str, payload: dict) -> None:
    notif = notification_repo.create(db, user_id, type_, payload)

    if type_ in EMAIL_WORTHY_TYPES:
        user = user_repo.get_by_id(db, user_id)
        if user:
            send_email(
                to=user.email,
                subject=f"CollabAI: {type_.replace('_', ' ')}",
                body=f"You have a new update in CollabAI: {type_.replace('_', ' ')}.",
            )
            notification_repo.mark_emailed(db, notif.id)


def list_notifications(db: Session, user_id) -> list[dict]:
    notifs = notification_repo.list_for_user(db, user_id)
    return [
        {
            "id": str(n.id),
            "type": n.type,
            "payload": n.payload,
            "read_at": n.read_at,
            "created_at": n.created_at,
        }
        for n in notifs
    ]


def mark_read(db: Session, notification_id, user_id) -> None:
    notification_repo.mark_read(db, notification_id, user_id)