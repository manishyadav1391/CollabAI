from sqlalchemy.orm import Session

from app.core.exceptions import PermissionDeniedError, ValidationError, NotFoundError
from app.core.permission_filter import can_access_project
from app.repositories import folder_repo


def create_folder(db: Session, project_id: str, parent_folder_id: str | None, name: str, user_id) -> dict:
    if not can_access_project(db, user_id, project_id):
        raise PermissionDeniedError("No access to this project")

    if parent_folder_id:
        parent = folder_repo.get_by_id(db, parent_folder_id)
        if not parent or str(parent.project_id) != str(project_id):
            raise NotFoundError("Parent folder not found in this project")

    folder = folder_repo.create_folder(db, project_id, parent_folder_id, name)
    return _to_dict(folder)


def list_folders(db: Session, project_id: str, user_id) -> list[dict]:
    if not can_access_project(db, user_id, project_id):
        raise PermissionDeniedError("No access to this project")

    return [_to_dict(f) for f in folder_repo.list_by_project(db, project_id)]


def delete_folder(db: Session, folder_id: str, user_id) -> None:
    folder = folder_repo.get_by_id(db, folder_id)
    if not folder:
        raise NotFoundError("Folder not found")
    if not can_access_project(db, user_id, str(folder.project_id)):
        raise PermissionDeniedError("No access to this project")
    if folder_repo.has_children(db, folder_id):
        raise ValidationError("Folder is not empty — move or delete its contents first")

    folder_repo.delete(db, folder_id)


def _to_dict(folder) -> dict:
    return {
        "id": str(folder.id),
        "project_id": str(folder.project_id),
        "parent_folder_id": str(folder.parent_folder_id) if folder.parent_folder_id else None,
        "name": folder.name,
    }
