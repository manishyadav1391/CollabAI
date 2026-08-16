# CollabAI — Technical Architecture Document
**Document 4 of 7 | Version 1.0 | Status: Draft**
**Stack:** Python (FastAPI) backend · Next.js frontend · Single cloud VM (Docker Compose) · Solo developer
**Derived from:** Document 2 (SRS) and Document 3 (UX/Product Design)

---

## 0. Scope Update From Document 3

Document 3, Section 11 flagged an open decision: how are invite links delivered? **Resolved here:** invite links (and other notifications) are sent by **email**, not manually copied. This adds one new dependency (an email-sending service) to v1. Push notifications remain deferred — no browser/mobile push in v1.

This is the only scope change from Document 1; everything else in that document's scope table still holds.

---

## 1. Purpose of This Document

This document defines the concrete system architecture, technology choices (with rationale), data model, API contracts, and deployment topology needed to build CollabAI v1. Every component here exists to satisfy a specific FR from the SRS — nothing is added "because it's best practice" if v1 doesn't need it.

## 2. Architecture Goals and Principles

1. **One VM, one `docker-compose.yml`.** Every service in v1 is a container on a single machine. No component here assumes multiple nodes.
2. **Self-hosted over managed, where free.** Per Document 1 §7 (no paid managed services), we self-host Postgres+pgvector, MinIO, and Redis. The one paid dependency is the LLM API itself (unavoidable) and now a transactional email provider (has a generous free tier).
3. **Async by default for anything slow.** Uploads, document processing, embeddings, and email sending never block an HTTP request — they go through a queue.
4. **Permission filtering lives in one shared code path.** Not reimplemented separately for search, AI retrieval, and direct document access (this directly satisfies FR-PERM-02).
5. **Every component is swappable later.** The target Phase 8 architecture (multiple API servers, managed vector DB, CDN, etc.) should be a *deployment* change, not a *rewrite* — achieved by keeping storage/queue/vector access behind thin internal interfaces.

## 3. System Overview (v1 Deployment Topology)

```
                              ┌──────────────┐
                              │    Client    │
                              │  (Browser)   │
                              └──────┬───────┘
                                     │ HTTPS
                              ┌──────▼───────┐
                              │  Caddy (TLS, │
                              │ reverse proxy)│
                              └──────┬───────┘
                     ┌───────────────┼────────────────┐
                     │               │                │
              ┌──────▼─────┐  ┌──────▼──────┐   ┌─────▼──────┐
              │  Next.js   │  │   FastAPI   │   │  FastAPI    │
              │  (frontend)│  │  HTTP API   │   │  WebSocket  │
              └────────────┘  └──────┬──────┘   └─────┬──────┘
                                     │                 │
                     ┌───────────────┼─────────────────┘
                     │               │
              ┌──────▼─────┐  ┌──────▼──────┐
              │   Redis    │  │  PostgreSQL │
              │ (queue +   │  │ (+pgvector  │
              │  pub/sub)  │  │  extension) │
              └──────┬─────┘  └─────────────┘
                     │
              ┌──────▼─────┐
              │   Worker   │
              │ (RQ jobs:  │
              │ processing,│
              │  email)    │
              └──────┬─────┘
                     │
        ┌────────────┼─────────────────┐
        │            │                 │
 ┌──────▼─────┐ ┌────▼─────┐   ┌───────▼────────┐
 │   MinIO    │ │ Anthropic│   │ Email Provider  │
 │ (object    │ │   API    │   │  (SMTP/API,     │
 │  storage)  │ │ (answers)│   │  e.g. Resend)   │
 └────────────┘ └──────────┘   └────────────────┘
```

All boxes except the three external services (Anthropic API, Email Provider, and the client browser) run as containers defined in one `docker-compose.yml` on one VM.

## 4. Component Breakdown

| Component | Technology | Responsibility |
|---|---|---|
| Reverse proxy | Caddy | TLS termination (auto HTTPS via Let's Encrypt), routes `/` → Next.js, `/api` → FastAPI, `/ws` → WebSocket |
| Frontend | Next.js | All UI screens from Document 3 |
| HTTP API | FastAPI | Auth, Workspace, Project, Document, Search, AI, Comments, Notifications endpoints |
| WebSocket service | FastAPI (same codebase, separate process/route) | Real-time chat (FR-CHAT-01–04) |
| Database | PostgreSQL 16 + `pgvector` extension | All relational data + vector embeddings in one database (see §5 rationale) |
| Cache / Queue broker | Redis | Job queue broker for RQ, WebSocket pub/sub for chat fan-out (ready for multi-instance later), simple rate-limit counters |
| Worker | Python (RQ worker) | Document processing (extract/chunk/embed), email sending, notification generation |
| Object storage | MinIO (self-hosted, S3-compatible) | Document file storage, presigned direct upload/download URLs |
| Embedding model | `sentence-transformers` (local, e.g. `all-MiniLM-L6-v2`) | Generates embeddings for chunks — runs on CPU in the worker, zero external cost |
| LLM (answer generation) | Anthropic API (Claude) | RAG answer generation, streamed to client |
| Email provider | Transactional email API (e.g. Resend / SendGrid / Amazon SES — pick one with a free tier) | Invite emails, notification emails |

## 5. Technology Choices & Rationale (Resolving Open Decisions)

| Decision | Choice | Rationale |
|---|---|---|
| Vector storage | **pgvector extension inside the same Postgres instance** (not a separate vector DB) | Avoids a second database to operate; at v1 scale (a handful of workspaces, thousands of chunks at most) pgvector performance is more than sufficient. Matches Document 1's "no managed vector DB" constraint. |
| Object storage | **MinIO**, self-hosted, S3-compatible API | Free, runs in Docker Compose, and because it speaks the S3 API, swapping to real AWS S3/cloud storage later (Phase 8) is a config change, not a code change. |
| Background jobs | **RQ (Redis Queue)**, not Celery | Simpler mental model and less operational overhead for a solo developer than Celery; Redis is already in the stack for pub/sub, so no new infrastructure. |
| Embeddings | **Local `sentence-transformers` model**, not an embeddings API | Avoids a second metered API dependency and per-document cost; runs fine on CPU at v1 volume. Only the answer-generation step calls a paid LLM API. |
| Search | **Postgres full-text search (`tsvector`/`GIN` index)**, not Elasticsearch | One database to run; sufficient for keyword search across a few thousand documents. |
| Invite/notification delivery | **Transactional email API** (this document's scope update) | Chosen over manual link-sharing per your instruction. Recommend a provider with a free tier (Resend, SendGrid, or Amazon SES) — pick one, store the API key in `.env`, and keep the sending code behind a single `EmailSender` interface so switching providers later is a one-file change. |
| Reverse proxy / TLS | **Caddy**, not nginx+certbot | Automatic HTTPS certificate provisioning/renewal with a ~5-line config — meaningfully less to maintain solo than nginx + certbot cron jobs. |
| Auth tokens | **JWT access token (short-lived) + opaque refresh token (stored hashed in DB, long-lived)** | Refresh tokens as opaque DB-backed tokens (not JWTs) so they can be revoked server-side on logout (FR-AUTH-04), which a stateless JWT refresh token cannot do cleanly. |

## 6. Data Model

### 6.1 Entity-Relationship Overview

```
User ──< WorkspaceMember >── Workspace ──< Project ──< ProjectPermission >── User
 │                                              │
 │                                              ├──< Folder ──< Document ──< DocumentVersion
 │                                              │                    │
 │                                              │                    ├──< DocumentChunk (embedding)
 │                                              │                    ├──< Comment ──< Comment (replies)
 │                                              │                    └──< ProcessingJob
 │                                              │
 │                                              ├──< Conversation ──< Message
 │                                              └──< AIConversation ──< AIMessage
 │
 └──< Notification
```

### 6.2 Core Table Definitions

**User**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | text, unique | |
| password_hash | text | bcrypt/argon2 |
| name | text | |
| created_at | timestamptz | |

**Workspace**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | text | |
| owner_id | UUID FK → User | |
| created_at | timestamptz | |
| deleted_at | timestamptz, nullable | soft delete |

**WorkspaceMember**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| workspace_id | UUID FK | |
| user_id | UUID FK | |
| role | enum(owner, admin, member) | |
| joined_at | timestamptz | |
| unique(workspace_id, user_id) | | |

**Invite**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| workspace_id | UUID FK | |
| email | text | invitee's email |
| token | text, unique | random, single-use |
| invited_role | enum(admin, member) | |
| expires_at | timestamptz | |
| accepted_at | timestamptz, nullable | |

**Project**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| workspace_id | UUID FK | |
| name | text | |
| visibility | enum(workspace_wide, restricted) | FR-PRJ-04 |
| created_at / deleted_at | timestamptz | soft delete, 30-day retention (NFR-11) |

**ProjectPermission** *(only populated when visibility = restricted)*
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| project_id | UUID FK | |
| user_id | UUID FK | |

**Folder**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| project_id | UUID FK | |
| parent_folder_id | UUID FK, nullable | self-referential |
| name | text | |

**Document**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| project_id | UUID FK | |
| folder_id | UUID FK, nullable | |
| current_version_id | UUID FK → DocumentVersion | |
| restricted | boolean | document-level override of project visibility |
| created_by | UUID FK → User | |
| deleted_at | timestamptz, nullable | |

**DocumentVersion**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| document_id | UUID FK | |
| object_storage_key | text | MinIO key |
| filename | text | |
| mime_type | text | |
| size_bytes | bigint | |
| status | enum(pending, processing, ready, processing_failed) | FR-PROC-05 |
| failure_reason | text, nullable | FR-DOC-06 |
| uploaded_at | timestamptz | |

**ProcessingJob**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| document_version_id | UUID FK | |
| idempotency_key | text, unique | FR-PROC-06 |
| status | enum(pending, processing, completed, failed) | |
| attempts | int | |
| created_at / updated_at | timestamptz | |

**DocumentChunk**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| document_version_id | UUID FK | |
| project_id | UUID FK (denormalized) | speeds permission filtering |
| chunk_text | text | |
| page_or_section | text | for citations (FR-AI-04) |
| embedding | vector(384) | pgvector column; 384 dims for MiniLM |

**Conversation** / **Message** (chat)
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| project_id | UUID FK | one conversation per project (v1 simplification) |
| Message.sequence_number | bigint | FR-CHAT-03, monotonic per conversation |
| Message.sender_id | UUID FK | |
| Message.content | text | |
| Message.created_at | timestamptz | |

**AIConversation** / **AIMessage**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| AIConversation.user_id / project_id | UUID FK | |
| AIMessage.role | enum(user, assistant) | |
| AIMessage.content | text | |
| AIMessage.citations | jsonb | array of {document_id, page_or_section} |

**Comment**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| document_id | UUID FK | |
| parent_comment_id | UUID FK, nullable | one level of threading |
| author_id | UUID FK | |
| content | text | |
| status | enum(open, resolved) | |

**Notification**
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| type | enum(mention, upload, added_to_project, processing_done, processing_failed) | |
| payload | jsonb | link target (project_id, document_id, comment_id, etc.) |
| read_at | timestamptz, nullable | |
| emailed_at | timestamptz, nullable | tracks whether email was also sent |
| created_at | timestamptz | |

## 7. API Contracts (v1 Endpoint Summary)

Full request/response schemas will live in the FastAPI OpenAPI docs generated from Pydantic models during implementation — this table is the authoritative *list* so nothing gets missed.

| Method | Path | Purpose | FR |
|---|---|---|---|
| POST | /auth/register | Create account (optionally with invite token) | FR-AUTH-01, FR-WS-03 |
| POST | /auth/login | Authenticate, issue tokens | FR-AUTH-02 |
| POST | /auth/refresh | Rotate access token | FR-AUTH-03 |
| POST | /auth/logout | Revoke refresh token | FR-AUTH-04 |
| POST | /auth/forgot-password | Send reset email | FR-AUTH-05 |
| POST | /auth/reset-password | Complete reset | FR-AUTH-05 |
| POST | /auth/change-password | Authenticated password change | FR-AUTH-06 |
| POST | /workspaces | Create workspace | FR-WS-01 |
| GET | /workspaces | List my workspaces | FR-WS-07 |
| POST | /workspaces/{id}/invites | Invite by email → sends email | FR-WS-02 |
| POST | /workspaces/{id}/members/{user_id}/role | Change role | FR-WS-05 |
| DELETE | /workspaces/{id}/members/{user_id} | Remove member | FR-WS-04 |
| DELETE | /workspaces/{id} | Delete workspace (Owner only) | FR-WS-06 |
| POST | /projects | Create project | FR-PRJ-01 |
| GET | /projects?workspace_id= | List accessible projects | FR-PRJ-02 |
| DELETE | /projects/{id} | Soft-delete project | FR-PRJ-03 |
| PUT | /projects/{id}/permissions | Set restricted members | FR-PRJ-04 |
| POST | /documents/upload-url | Get presigned upload URL | FR-DOC-01, FR-DOC-05 |
| POST | /documents/upload-complete | Confirm upload, enqueue processing job | FR-PROC-01 |
| GET | /documents?project_id= | List documents/folders | FR-DOC-02 |
| GET | /documents/{id}/download-url | Get presigned download URL | FR-DOC-03 |
| DELETE | /documents/{id} | Soft-delete document | FR-DOC-04 |
| GET | /documents/{id}/versions | Version history | FR-DOC-07 |
| GET | /search?q=&project_id= | Permission-filtered keyword search | FR-SRCH-01–03 |
| POST | /ai/ask | Ask a question (streamed response) | FR-AI-01–07 |
| GET | /ai/conversations | Past AI Q&A | FR-AI-06 |
| POST | /documents/{id}/comments | Add comment | FR-CMT-01 |
| PUT | /comments/{id}/resolve | Resolve/reopen | FR-CMT-03 |
| DELETE | /comments/{id} | Delete comment | FR-CMT-04 |
| GET | /notifications | List notifications | FR-NOTIF-01 |
| PUT | /notifications/{id}/read | Mark read | FR-NOTIF-03 |
| WS | /ws/chat/{project_id} | Real-time chat channel | FR-CHAT-01–04 |

## 8. Background Job Architecture

```
Upload confirmed → enqueue("process_document", document_version_id, idempotency_key)
                                │
                                ▼
                        RQ Worker picks job
                                │
                pending → processing (DB status update)
                                │
                ┌───────────────┼────────────────┐
                ▼               ▼                ▼
          Extract text    Split into chunks   Store page/section refs
                                │
                                ▼
                  Generate embeddings (local model)
                                │
                                ▼
                 Store DocumentChunk rows (with vectors)
                                │
                                ▼
                     status → completed
                                │
                                ▼
                 enqueue("notify", user_id, "processing_done")
```

**Failure handling (NFR-05, FR-PROC-06):** RQ's job timeout returns an in-flight job to the queue if the worker dies mid-processing. The `idempotency_key` on `ProcessingJob`, plus a `DELETE FROM document_chunk WHERE document_version_id = ?` at the start of processing (before re-inserting), makes retries safe — a retried job never leaves duplicate chunks.

**Email jobs** follow the identical pattern: `enqueue("send_email", to, template, context)` — never sent synchronously inside a request.

## 9. AI / RAG Pipeline Architecture

```
User question + project_id + user_id
              │
              ▼
   Embed the question (local model)
              │
              ▼
   pgvector similarity search on DocumentChunk
   WHERE project_id IN (permission_filtered_project_ids(user_id))
     AND document NOT restricted-to-others(user_id)      ← FR-AI-02, FR-PERM-02
              │
              ▼
   Top-K chunks (e.g. K=6) ranked by similarity
              │
              ▼
   If zero chunks found → return FR-AI-05 fallback message, skip LLM call
              │
              ▼
   Construct prompt: system instructions + question + chunks (with source labels)
              │
              ▼
   Call Anthropic API with streaming enabled
              │
              ▼
   Stream tokens to client via Server-Sent Events (or chunked HTTP response)
              │
              ▼
   Parse citations from source labels → attach as structured citations (FR-AI-04)
              │
              ▼
   Persist AIMessage (question + answer + citations) for history (FR-AI-06)
```

**The permission filter (`permission_filtered_project_ids` / restricted-document check) is a single shared function**, imported by both the AI retrieval code path and the search code path (§10) — this is the concrete implementation of Design Principle 4 (§2) and directly satisfies FR-PERM-02's requirement for consistent enforcement.

## 10. Search Architecture

```
Keyword query + user_id
        │
        ▼
Postgres full-text query (tsvector/GIN index on Document text)
   WHERE project_id IN (permission_filtered_project_ids(user_id))   ← same shared function as §9
        │
        ▼
Ranked, paginated results
```

## 11. Real-Time Chat Architecture (v1: Single Instance)

```
Client ── WebSocket ──▶ FastAPI /ws/chat/{project_id}
                              │
                    Validate token, project membership
                              │
              On message: persist Message (with sequence_number)
                              │
              Publish to Redis pub/sub channel: chat:{project_id}
                              │
        All connections subscribed to chat:{project_id} receive it
                    (currently all on the same process —
                     the Redis pub/sub layer is what makes this
                     trivially extensible to multiple WebSocket
                     processes in Phase 8 without a rewrite)
```

## 12. Email Architecture (New — This Document's Scope Update)

```
Trigger (invite created, notification generated)
              │
              ▼
   enqueue("send_email", to=user.email, template=<name>, context={...})
              │
              ▼
   Worker renders template (Jinja2) → calls Email Provider API/SMTP
              │
              ▼
   On success: mark Invite/Notification as emailed_at = now()
   On failure: retry with backoff (same job-retry mechanism as §8);
               after max attempts, log failure — in-app notification
               still exists regardless (email is additive, not the
               only channel, so a failed email never blocks the user)
```

**Templates needed for v1:** invite email, password reset email, and (optionally) a notification email for the highest-value events only (e.g., "you were mentioned") — not every notification needs an email to avoid spamming users; this can be a per-notification-type flag.

**Provider choice:** left as a `.env`-configured choice (`EMAIL_PROVIDER=resend|sendgrid|ses`) behind one `EmailSender` interface — pick whichever has the simplest signup when you get to Phase 2/3 implementation; the architecture doesn't care which.

## 13. Authentication & Token Architecture

```
Login success
       │
       ├──▶ Access Token (JWT, ~15 min expiry, contains user_id + workspace roles)
       └──▶ Refresh Token (opaque random string, ~30 day expiry, HASHED and stored in DB)

Each API request:
   Authorization: Bearer <access_token> → verify JWT signature + expiry

Access token expired:
   Client calls /auth/refresh with refresh token
       → server looks up hash in DB, checks not revoked/expired
       → issues new access token (+ optionally rotates refresh token)

Logout:
   → server deletes/marks the refresh token row as revoked (FR-AUTH-04)
```

## 14. Deployment Architecture

**`docker-compose.yml` services (v1):** `caddy`, `frontend` (Next.js), `api` (FastAPI HTTP), `ws` (FastAPI WebSocket — can start as the same container/process as `api` initially and split later if needed), `worker` (RQ), `postgres` (with pgvector), `redis`, `minio`.

**Single command startup (NFR-12):** `docker-compose up -d` after `.env` is populated.

### 14.1 Required Environment Variables (`.env`)

```
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
ACCESS_TOKEN_EXPIRY_MINUTES=15
REFRESH_TOKEN_EXPIRY_DAYS=30
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=
ANTHROPIC_API_KEY=
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
EMAIL_PROVIDER=          # resend | sendgrid | ses
EMAIL_API_KEY=
EMAIL_FROM_ADDRESS=
FRONTEND_BASE_URL=       # used to build invite/reset links in emails
```

## 15. Scalability Notes (Not Built Now — Just Not Blocked Later)

| v1 choice | Why it doesn't block Phase 8 |
|---|---|
| pgvector in main Postgres | Can migrate to a dedicated vector DB later behind the same retrieval interface |
| MinIO | S3-compatible API means swapping to real cloud storage is a config change |
| Redis pub/sub for chat | Already the exact mechanism needed for multi-instance fan-out — just add more WebSocket instances later |
| RQ single worker | Add more worker containers pointed at the same Redis queue — no code change |
| Single Postgres instance | Read replicas/sharding are a Phase 8 infrastructure change, not a schema rewrite (UUIDs as PKs throughout make future sharding easier) |

## 16. Summary of Decisions Resolved in This Document

| Open item | Resolution |
|---|---|
| Vector storage (Doc 1 §8) | pgvector in main Postgres |
| Object storage (Doc 1 §8) | MinIO |
| Invite delivery (Doc 3 §11) | Email (transactional email API) — **scope updated to include email sending** |
| PDF preview rendering (Doc 3 §11) | Deferred to implementation detail — recommend client-side PDF.js in Next.js to avoid server-side rendering load; not architecturally significant enough to require a decision now |

---

**Next document:** Security & Compliance Document — this will take the permission-filtering design from Sections 9–10 and formalize it into explicit security requirements and test obligations, plus auth/data-handling/email-security details.
