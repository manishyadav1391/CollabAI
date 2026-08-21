/** Mirrors the Pydantic response schemas in backend/app/schemas. */

export type Workspace = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
};

export type Member = {
  user_id: string;
  email: string;
  name: string;
  role: string;
};

export type Project = {
  id: string;
  workspace_id: string;
  name: string;
  visibility: string;
  created_at: string;
};

export type DocumentStatus = "pending" | "processing" | "ready" | "processing_failed";

export type DocumentVersion = {
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: DocumentStatus;
  failure_reason: string | null;
  uploaded_at: string;
};

export type Document = {
  id: string;
  project_id: string;
  folder_id: string | null;
  restricted: boolean;
  created_by: string;
  current_version: DocumentVersion | null;
};

export type CommentStatus = "open" | "resolved";

export type Comment = {
  id: string;
  parent_comment_id: string | null;
  author_id: string;
  content: string;
  status: CommentStatus;
  created_at: string;
};
