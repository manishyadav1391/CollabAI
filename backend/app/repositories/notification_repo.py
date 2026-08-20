from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.notification import Notification


def create(db: Session, user_id, type_: str, payload: dict) -> Notification:
    notif = Notification(user_id=user_id, type=type_, payload=payload)
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def list_for_user(db: Session, user_id, limit: int = 50) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )


def mark_read(db: Session, notification_id, user_id) -> None:
    notif = db.query(Notification).filter(
        Notification.id == notification_id, Notification.user_id == user_id,
    ).first()
    if notif:
        notif.read_at = datetime.now(timezone.utc)
        db.commit()


def mark_emailed(db: Session, notification_id) -> None:
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.emailed_at = datetime.now(timezone.utc)
        db.commit()