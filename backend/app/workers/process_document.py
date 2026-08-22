"""
The document processing job: extract text -> chunk -> embed -> store.

Runs in the RQ worker process (see worker_main.py), not in the API
process. Implements idempotency per docs/04-technical-architecture.md §8:
if this job is retried (e.g. the worker crashed mid-run), it deletes any
partial chunks from the previous attempt before re-inserting, so retries
never produce duplicates.
"""

import io

from pypdf import PdfReader
import docx as docx_lib

from app.core.db import SessionLocal
from app.core.embeddings import embed_text
from app.core import storage
from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.document_chunk import DocumentChunk
from app.models.processing_job import ProcessingJob
from app.services.notification_service import enqueue_notification

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def extract_text_pages(file_bytes: bytes, filename: str) -> list[tuple[int | None, str]]:
    """Returns (page_number, text) pairs so chunks can cite the exact page
    they came from. page_number is 1-based for PDFs; formats with no
    natural page concept (docx, plain text) come back as a single page
    with page_number=None, so their citations just won't show a page.

    Scanned/image-only PDFs (no text layer) come back empty — there's no
    OCR fallback — and `run()`'s "no extractable text" check turns that
    into a clear processing_failed rather than silently indexing nothing."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
        return [(i + 1, text) for i, text in enumerate(pages)]
    elif lower.endswith(".docx"):
        doc = docx_lib.Document(io.BytesIO(file_bytes))
        return [(None, "\n".join(p.text for p in doc.paragraphs))]
    else:
        return [(None, file_bytes.decode("utf-8", errors="ignore"))]


def chunk_text(text: str) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start = end - CHUNK_OVERLAP
    return [c.strip() for c in chunks if c.strip()]


def chunk_pages(pages: list[tuple[int | None, str]]) -> list[tuple[str, int | None]]:
    """Chunks each page's text independently so every chunk can be tagged
    with the page it came from — chunks never span a page boundary."""
    return [(chunk, page_number) for page_number, text in pages for chunk in chunk_text(text)]


def run(document_id: str, version_id: str, job_id: str) -> None:
    db = SessionLocal()
    try:
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        job.status = "processing"
        job.attempts += 1
        db.commit()

        document = db.query(Document).filter(Document.id == document_id).first()
        version = db.query(DocumentVersion).filter(DocumentVersion.id == version_id).first()

        from app.models.project import Project
        project = db.query(Project).filter(Project.id == document.project_id).first()
        notification_context = {
            "document_id": str(document.id),
            "project_id": str(document.project_id),
            "workspace_id": str(project.workspace_id) if project else None,
            "filename": version.filename,
        }

        try:
            file_bytes = storage.download_file(version.object_storage_key)
            text_pages = extract_text_pages(file_bytes, version.filename)
            if not any(text.strip() for _, text in text_pages):
                raise ValueError("No extractable text found in file")

            # Idempotency: wipe any chunks from a previous (failed/retried)
            # attempt on this version before inserting fresh ones.
            db.query(DocumentChunk).filter(DocumentChunk.document_version_id == version_id).delete()
            db.commit()

            for chunk, page_number in chunk_pages(text_pages):
                embedding = embed_text(chunk)
                db.add(DocumentChunk(
                    document_version_id=version_id,
                    project_id=document.project_id,
                    chunk_text=chunk,
                    page_or_section=f"Page {page_number}" if page_number else None,
                    embedding=embedding,
                ))
            db.commit()

            version.status = "ready"
            job.status = "completed"
            db.commit()
            enqueue_notification(document.created_by, "processing_done", notification_context)
        except Exception as e:
            db.rollback()
            version.status = "processing_failed"
            version.failure_reason = str(e)
            job.status = "failed"
            db.commit()
            enqueue_notification(document.created_by, "processing_failed", notification_context)

    finally:
        db.close()