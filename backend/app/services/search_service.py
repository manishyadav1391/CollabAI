"""
Keyword search — permission-filtered BEFORE the query runs, per
docs/05-security-compliance.md §5.2. Never fetch first and filter after.
"""

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.permission_filter import permission_filtered_project_ids


def search(db: Session, user_id, query_text: str, project_id: str | None = None) -> list[dict]:
    allowed_project_ids = permission_filtered_project_ids(db, user_id)

    # If a specific project was requested, narrow to it — but only if
    # it's actually in the allowed set. Never trust the caller's
    # project_id on its own.
    if project_id:
        if project_id not in [str(p) for p in allowed_project_ids]:
            return []
        scope_ids = [project_id]
    else:
        scope_ids = [str(p) for p in allowed_project_ids]

    if not scope_ids:
        return []

    rows = db.execute(
        text("""
            SELECT
                dc.document_version_id,
                dv.document_id,
                dv.filename,
                dc.project_id,
                ts_headline(dc.chunk_text, plainto_tsquery(:query)) AS snippet
            FROM document_chunks dc
            JOIN document_versions dv ON dv.id = dc.document_version_id
            WHERE dc.project_id = ANY(CAST(:project_ids AS uuid[]))
              AND to_tsvector(dc.chunk_text) @@ plainto_tsquery(:query)
            LIMIT 20
        """),
        {"query": query_text, "project_ids": scope_ids},
    ).fetchall()

    return [
        {
            "document_id": str(row.document_id),
            "filename": row.filename,
            "project_id": str(row.project_id),
            "snippet": row.snippet,
        }
        for row in rows
    ]