"""
Keyword search — permission-filtered BEFORE the query runs, per
docs/05-security-compliance.md §5.2. Never fetch first and filter after.
"""

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.permission_filter import permission_filtered_project_ids
from app.models.project import Project

DEFAULT_LIMIT = 20


def search(
    db: Session,
    user_id,
    query_text: str,
    project_id: str | None = None,
    workspace_id: str | None = None,
    limit: int = DEFAULT_LIMIT,
    offset: int = 0,
) -> dict:
    allowed_project_ids = [str(p) for p in permission_filtered_project_ids(db, user_id)]

    # If a specific project was requested, narrow to it — but only if
    # it's actually in the allowed set. Never trust the caller's
    # project_id on its own.
    if project_id:
        scope_ids = [project_id] if project_id in allowed_project_ids else []
    elif workspace_id:
        scope_ids = [
            str(row.id)
            for row in db.query(Project)
            .filter(Project.id.in_(allowed_project_ids), Project.workspace_id == workspace_id)
            .all()
        ]
    else:
        scope_ids = allowed_project_ids

    if not scope_ids:
        return {"results": [], "has_more": False}

    # Fetch one extra row to know whether a next page exists, without a
    # separate COUNT query — same trick as chat history pagination.
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
            JOIN documents d ON d.id = dv.document_id
            WHERE dc.project_id = ANY(CAST(:project_ids AS uuid[]))
              AND to_tsvector(dc.chunk_text) @@ plainto_tsquery(:query)
              AND (
                    d.restricted = false
                    OR d.created_by = CAST(:user_id AS uuid)
                    OR EXISTS (
                        SELECT 1 FROM document_permissions dp
                        WHERE dp.document_id = d.id AND dp.user_id = CAST(:user_id AS uuid)
                    )
              )
            ORDER BY dc.document_version_id
            LIMIT :limit OFFSET :offset
        """),
        {
            "query": query_text, "project_ids": scope_ids, "user_id": str(user_id),
            "limit": limit + 1, "offset": offset,
        },
    ).fetchall()

    has_more = len(rows) > limit
    page = rows[:limit]

    return {
        "results": [
            {
                "document_id": str(row.document_id),
                "filename": row.filename,
                "project_id": str(row.project_id),
                "snippet": row.snippet,
            }
            for row in page
        ],
        "has_more": has_more,
    }