from sqlalchemy.orm import Session

from app.repositories import notification_repo, user_repo
from app.services.email_service import send_email

# Only these notification types also trigger an email — avoids spamming
# users for every minor event (docs/04-technical-architecture.md §12).
EMAIL_WORTHY_TYPES = {"processing_failed", "added_to_project"}


def enqueue_notification(user_id, type_: str, payload: dict) -> None:
    """The only entry point request/job code outside this module should
    use — pushes the actual DB write + email + live push onto the queue
    so nothing (an HTTP request, a WebSocket message loop, a processing
    job) ever blocks on notification delivery."""
    from app.core.queue import queue
    from app.workers.notify import send_notification

    queue.enqueue(send_notification, str(user_id), type_, payload)


def create_notification(db: Session, user_id, type_: str, payload: dict) -> dict:
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

    return {
        "id": str(notif.id),
        "type": notif.type,
        "payload": notif.payload,
        "read_at": notif.read_at,
        "created_at": notif.created_at,
    }


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


def get_unread_count(db: Session, user_id) -> int:
    return notification_repo.count_unread(db, user_id)


def mark_all_read(db: Session, user_id) -> None:
    notification_repo.mark_all_read(db, user_id)