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

export type InvitePreview = {
  workspace_id: string;
  workspace_name: string;
  email: string;
  role: string;
};

export type ChatMessage = {
  id: string;
  sender_id: string;
  content: string;
  sequence_number: number;
  created_at: string;
  read?: boolean;
};

export type DMThread = {
  conversation_id: string;
  other_user_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count?: number;
};

export type NotificationPayload = {
  conversation_id?: string;
  project_id?: string;
  workspace_id?: string;
  document_id?: string;
  comment_id?: string;
  filename?: string;
  kind?: "room" | "dm";
  sender_id?: string;
  preview?: string;
  [key: string]: unknown;
};

export type Notification = {
  id: string;
  type: string;
  payload: NotificationPayload | null;
  read_at: string | null;
  created_at: string;
};

export type AIConversationSummary = {
  id: string;
  title: string;
  updated_at: string;
};

export type Project = {
  id: string;
  workspace_id: string;
  name: string;
  visibility: string;
  created_at: string;
  deleted_at?: string | null;
};

export type DocumentStatus = "pending" | "processing" | "ready" | "processing_failed" | "aborted";

export type DocumentVersion = {
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: DocumentStatus;
  failure_reason: string | null;
  uploaded_at: string;
  /** Client-only — percent complete while a chunked upload (FR-DOC-05) is
   * still sending parts. Never set by the backend. */
  upload_progress?: number;
};

export type Document = {
  id: string;
  project_id: string;
  folder_id: string | null;
  restricted: boolean;
  created_by: string;
  current_version: DocumentVersion | null;
};

export type Folder = {
  id: string;
  project_id: string;
  parent_folder_id: string | null;
  name: string;
};

export type SearchResult = {
  document_id: string;
  filename: string;
  project_id: string;
  snippet: string;
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
