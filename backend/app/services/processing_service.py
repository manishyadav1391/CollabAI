import uuid
from sqlalchemy.orm import Session

from app.core.queue import queue
from app.models.processing_job import ProcessingJob
from app.workers.process_document import run as process_document_run


def enqueue_processing(db: Session, document_id: str, version_id: str) -> None:
    job = ProcessingJob(
        document_version_id=version_id,
        idempotency_key=str(uuid.uuid4()),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    queue.enqueue(process_document_run, document_id, version_id, str(job.id))