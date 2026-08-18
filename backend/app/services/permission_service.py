"""
Front door for permission-related checks used by services/routers.

Phase 1: wraps the role hierarchy used by core/deps.require_role.
Phase 4 will extend this module to also expose
permission_filtered_project_ids() backed by core/permission_filter.py
— see docs/05-security-compliance.md §5. Nothing else should
reimplement role/permission comparison logic outside this file and
core/deps.py.
"""

from app.core.deps import ROLE_RANK


def role_at_least(actual_role: str, min_role: str) -> bool:
    return ROLE_RANK.get(actual_role, -1) >= ROLE_RANK.get(min_role, 99)