# CollabAI — Software Requirements Specification (SRS)
**Document 2 of 7 | Version 1.0 | Status: Draft**
**Stack:** Python (FastAPI) backend · Next.js frontend · Single cloud VM (Docker Compose) · Solo developer
**Derived from:** Document 1 — Product Vision & Scope

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the functional and non-functional requirements for **CollabAI v1**, scoped exactly per Document 1, Section 5. Every requirement below either maps to an "In Scope" row of that table, or it does not belong in v1.

### 1.2 Scope Reminder
v1 is a single-VM, single-process-per-service system for a team of 3–15 users. Distributed-systems requirements (sharding, multi-node pub/sub, CRDT editing, auto-scaling) are explicitly **out of scope** and are not restated here — see Document 1, Section 5 for the deferred list.

### 1.3 Definitions

| Term | Meaning |
|---|---|
| Workspace | Top-level tenant/organization container |
| Project | Sub-container inside a workspace holding documents/chat/comments |
| RAG | Retrieval-Augmented Generation — AI answers grounded in retrieved document chunks |
| FR | Functional Requirement |
| NFR | Non-Functional Requirement |

### 1.4 References
- Document 1: Product Vision & Scope (v1.0)

---

## 2. Overall Description

### 2.1 Product Perspective
CollabAI v1 is a new, standalone system: one FastAPI backend, one Next.js frontend, one Postgres database (with pgvector extension), one Redis instance, one background worker process, one object storage bucket (self-hosted MinIO or cloud equivalent), running via Docker Compose on a single VM.

### 2.2 User Classes and Characteristics

| Role | Description | Technical skill assumed |
|---|---|---|
| Owner | Creates workspace, full control including delete | None — normal end user |
| Admin | Manages members/projects/documents, cannot delete workspace | None |
| Member | Uses the product day-to-day: views, uploads, chats, asks AI | None |

### 2.3 Operating Environment
- Server: single Linux cloud VM (free-tier class), Docker + Docker Compose.
- Client: modern desktop browser (Chrome/Firefox/Edge, current versions). Mobile browser support is best-effort, not a v1 requirement.

### 2.4 Design and Implementation Constraints
- Backend: Python 3.11+, FastAPI.
- Frontend: Next.js.
- No paid managed services in v1 (no managed vector DB / managed search) — see Document 1 §7.
- LLM calls go through a metered external API — cost-awareness required in design (batching, context size limits), detailed in Architecture doc.

### 2.5 Assumptions and Dependencies
- A third-party LLM API (e.g., Anthropic API) is available and reachable from the VM.
- Users have valid email addresses for registration/invites.
- File uploads are assumed to be well-formed PDF/DOCX/TXT; malformed files may fail processing gracefully (see FR-DOC-06).

---

## 3. Functional Requirements

Each requirement has an ID, priority (Must/Should/Could — MoSCoW), and acceptance note.

### 3.1 Authentication (AUTH)

| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-01 | User can register with email + password. Password is hashed (bcrypt/argon2) before storage. | Must |
| FR-AUTH-02 | User can log in and receive a short-lived JWT access token + longer-lived refresh token. | Must |
| FR-AUTH-03 | User can refresh an access token using a valid refresh token. | Must |
| FR-AUTH-04 | User can log out; refresh token is invalidated server-side. | Must |
| FR-AUTH-05 | User can request a password reset via email link (token-based, time-limited). | Should |
| FR-AUTH-06 | User can change their password while logged in, requiring current password confirmation. | Should |
| FR-AUTH-07 | All non-auth endpoints reject requests without a valid access token (401). | Must |

### 3.2 Workspace Management (WS)

| ID | Requirement | Priority |
|---|---|---|
| FR-WS-01 | Authenticated user can create a workspace; creator becomes Owner. | Must |
| FR-WS-02 | Owner/Admin can invite a member by email; invite generates a token-based join link. | Must |
| FR-WS-03 | Invited user who doesn't have an account can register and auto-join the workspace via the invite link. | Must |
| FR-WS-04 | Owner/Admin can remove a member from the workspace. | Must |
| FR-WS-05 | Owner/Admin can change a member's role (Admin/Member), except Owner cannot be demoted except by transferring ownership. | Should |
| FR-WS-06 | Owner can delete the entire workspace (irreversible; requires confirmation step). | Must |
| FR-WS-07 | A user can belong to multiple workspaces and switch between them. | Must |

### 3.3 Project Management (PRJ)

| ID | Requirement | Priority |
|---|---|---|
| FR-PRJ-01 | Owner/Admin can create a project inside a workspace. | Must |
| FR-PRJ-02 | Any workspace member can view the list of projects they have access to. | Must |
| FR-PRJ-03 | Owner/Admin can delete a project (soft-delete, recoverable for 30 days). | Should |
| FR-PRJ-04 | Owner/Admin can restrict a project's visibility to specific members (project-level permission), overriding default workspace-wide visibility. | Must |

### 3.4 Document Management (DOC)

| ID | Requirement | Priority |
|---|---|---|
| FR-DOC-01 | Member with project access can upload a document (PDF, DOCX, TXT) directly to object storage (not routed through app server memory). | Must |
| FR-DOC-02 | Uploaded document is organized into folders within a project. | Should |
| FR-DOC-03 | Member can download a document they have permission to view. | Must |
| FR-DOC-04 | Member (with appropriate role) can delete a document (soft-delete). | Must |
| FR-DOC-05 | System supports resumable/chunked upload for files >20MB. | Should |
| FR-DOC-06 | If document processing (text extraction) fails, the document is marked `processing_failed` with a visible reason; upload itself still succeeds. | Must |
| FR-DOC-07 | Each document has version history; re-uploading the same document creates a new version rather than overwriting. | Could |

### 3.5 Document Processing (PROC)

| ID | Requirement | Priority |
|---|---|---|
| FR-PROC-01 | On upload, a processing job is queued (not processed inline in the request). | Must |
| FR-PROC-02 | Worker extracts text from PDF/DOCX/TXT. | Must |
| FR-PROC-03 | Worker splits extracted text into chunks (with page/section reference retained). | Must |
| FR-PROC-04 | Worker generates embeddings for each chunk and stores them in the vector store, tagged with the document's permission scope. | Must |
| FR-PROC-05 | Job status is tracked (`pending` → `processing` → `completed`/`failed`) and visible to the uploading user. | Must |
| FR-PROC-06 | Job processing is idempotent — retrying a job does not create duplicate chunks/embeddings. | Must |

### 3.6 AI Copilot / RAG (AI)

| ID | Requirement | Priority |
|---|---|---|
| FR-AI-01 | Member can ask a natural-language question scoped to a project (or workspace-wide). | Must |
| FR-AI-02 | System retrieves relevant document chunks via vector similarity search, **filtered to only documents the asking user has permission to view**. | Must (security-critical) |
| FR-AI-03 | System constructs a prompt with retrieved context and calls the LLM API. | Must |
| FR-AI-04 | Answer is returned with citations (document name + page/section) for each claim drawn from a source. | Must |
| FR-AI-05 | If no relevant/permitted document is found, system responds that it cannot answer from available documents — it does not guess. | Must |
| FR-AI-06 | AI conversation history is saved per user, so they can revisit past Q&A. | Should |
| FR-AI-07 | Response is streamed to the client token-by-token (not returned only after full completion). | Should |

### 3.7 Real-Time Chat (CHAT)

| ID | Requirement | Priority |
|---|---|---|
| FR-CHAT-01 | Members of a project can send/receive text messages in real time via WebSocket. | Must |
| FR-CHAT-02 | Messages are persisted and paginated (loading history in pages, not all at once). | Must |
| FR-CHAT-03 | Each message carries a sequence number so clients can detect and correct out-of-order delivery. | Should |
| FR-CHAT-04 | Online/offline presence indicator per member within a project. | Could |

### 3.8 Comments (CMT)

| ID | Requirement | Priority |
|---|---|---|
| FR-CMT-01 | Member can add a comment on a document. | Must |
| FR-CMT-02 | Comments support threaded replies (one level). | Should |
| FR-CMT-03 | Comment can be marked Resolved / Reopened. | Should |
| FR-CMT-04 | Comment author or Admin/Owner can delete a comment. | Must |

### 3.9 Notifications (NOTIF)

| ID | Requirement | Priority |
|---|---|---|
| FR-NOTIF-01 | System generates an in-app notification for: mention in a comment, document uploaded to a project you're in, added to a project, AI processing completed/failed. | Must |
| FR-NOTIF-02 | Notifications are generated asynchronously via a queue, not inline in the triggering request. | Must |
| FR-NOTIF-03 | User can mark notifications as read; unread count is visible in the UI. | Should |

### 3.10 Search (SRCH)

| ID | Requirement | Priority |
|---|---|---|
| FR-SRCH-01 | Member can keyword-search document text within projects they have access to. | Must |
| FR-SRCH-02 | Search results are permission-filtered (no result from a document the user can't view). | Must (security-critical) |
| FR-SRCH-03 | Search results are paginated. | Should |

### 3.11 Permissions (PERM)

| ID | Requirement | Priority |
|---|---|---|
| FR-PERM-01 | Every API endpoint enforces role-based access control at the service layer (not just hidden in the UI). | Must |
| FR-PERM-02 | Document/project-level visibility restrictions (FR-PRJ-04) are enforced in: direct document access, search (FR-SRCH-02), and AI retrieval (FR-AI-02) — all three, consistently. | Must (security-critical) |
| FR-PERM-03 | Permission checks are covered by automated tests, including at least one explicit "AI must not leak a restricted document" test case. | Must |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | For a workspace of ≤15 users, API responses (non-AI) return in <500ms p95 under normal load. |
| NFR-02 | Performance | Document processing (upload → searchable/askable) completes within ~60 seconds for a typical (<20 page) PDF. |
| NFR-03 | Security | Passwords hashed with a modern algorithm (bcrypt/argon2); JWT secrets stored in environment config, never in source. |
| NFR-04 | Security | All traffic served over HTTPS/TLS (via reverse proxy on the VM). |
| NFR-05 | Reliability | Background jobs (processing, notifications) survive a worker crash — a crashed job returns to `pending` and is retried, not lost. |
| NFR-06 | Reliability | Idempotency keys prevent duplicate processing on client retry (uploads, jobs). |
| NFR-07 | Usability | A new user can create a workspace, invite a teammate, and upload a first document without external documentation (self-evident UI). |
| NFR-08 | Maintainability | Codebase follows the conventions defined in Document 7 (Development Standards) from day one — not retrofitted later. |
| NFR-09 | Rate Limiting | AI endpoint is rate-limited per user (single-instance limiter is sufficient for v1) to control LLM API cost exposure. |
| NFR-10 | Observability | All requests are logged with a request ID; logs are sufficient to trace a request from API → worker → DB without a distributed tracing system (v1 doesn't need one). |
| NFR-11 | Data Retention | Soft-deleted projects/documents are retained 30 days before permanent deletion. |
| NFR-12 | Portability | Entire system starts via a single `docker-compose up` with documented `.env` variables — no manual multi-step setup. |

---

## 5. External Interface Requirements (High-Level)

Full API contracts belong in the Architecture document; this section only lists the required endpoint groups so nothing is missed later:

- `/auth/*` — register, login, refresh, logout, password reset
- `/workspaces/*` — CRUD, invites, members
- `/projects/*` — CRUD, project-level permissions
- `/documents/*` — upload (direct-to-storage flow), download, delete, versions, folders
- `/search/*` — keyword search
- `/ai/*` — ask, conversation history
- `/comments/*` — CRUD, resolve/reopen
- `/notifications/*` — list, mark-read
- `/ws/chat/*` — WebSocket endpoint for real-time chat

---

## 6. Data Requirements (Entity List — Detail in Architecture Doc)

`User, Workspace, WorkspaceMember, Project, ProjectPermission, Document, DocumentVersion, Folder, ProcessingJob, DocumentChunk (with embedding), Conversation, Message, AIConversation, AIMessage, Comment, Notification`

---

## 7. Representative Use Cases

**UC-1: Ask AI a scoped question**
1. Member opens a project and types a question in the AI panel.
2. System retrieves top-N relevant chunks from documents the member can access.
3. System calls the LLM with the question + retrieved context.
4. System streams back an answer with citations.
5. **Alternate flow:** if a relevant chunk exists but belongs to a document the member cannot access, it is excluded from retrieval entirely — the member never learns the document exists.

**UC-2: Upload and process a document**
1. Member selects a file; frontend requests an upload session from the backend.
2. Frontend uploads directly to object storage using the session.
3. Backend receives an upload-complete webhook/callback, creates a `ProcessingJob`, pushes to queue.
4. Worker picks up the job, extracts text, chunks it, embeds it, stores vectors, marks job `completed`.
5. Notification is generated for the uploader.

**UC-3: Restricted document permission**
1. Admin marks a document as restricted to a subset of members (FR-PRJ-04 at document level, or project-level).
2. A non-permitted member searches for a term only found in that document.
3. Search returns zero results for that document (FR-SRCH-02).
4. The same member asks the AI a related question — AI answers based only on documents they can see, or states it cannot answer (FR-AI-05).

---

## 8. Acceptance Criteria (Traceability to Document 1, Section 6)

| Vision Success Criterion | Satisfied By |
|---|---|
| Create workspace, invite teammate, both log in | FR-WS-01–03, FR-AUTH-01–02 |
| Upload PDF → searchable/askable in ~1 min | FR-DOC-01, FR-PROC-01–05, NFR-02 |
| AI answer with correct citation | FR-AI-03–04 |
| No permission leakage via AI/search | FR-AI-02, FR-SRCH-02, FR-PERM-02–03 |
| Real-time chat between two users | FR-CHAT-01 |
| Runs via `docker-compose up` on one VM | NFR-12 |

---

## 9. Out-of-Scope Statement (Repeated for Clarity)

Real-time collaborative editing (OT/CRDT), multi-node chat/pub-sub, sharding/replication, dedicated search engine, CDN, auto-scaling, distributed rate limiting, distributed tracing, and email/push notifications are **not** requirements of this SRS. They are deferred per Document 1, Section 5, and will get their own requirements when their phase begins.

---

**Next document:** UX / Product Design — user flows and screen list derived directly from the functional requirements above.
