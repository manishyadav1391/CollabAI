from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_action(db: Session, actor_id, action: str, target_type: str, target_id: str, details: dict | None = None) -> None:
    db.add(AuditLog(actor_id=actor_id, action=action, target_type=target_type, target_id=str(target_id), details=details))
    db.commit()