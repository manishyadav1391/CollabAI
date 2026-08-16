# CollabAI — Implementation & File Build Guide
**Document 8 (Build Companion) | Version 1.0 | Status: Draft**
**Stack:** Python (FastAPI) backend · Next.js frontend · Single cloud VM (Docker Compose) · Solo developer
**Derived from:** Documents 4 (Architecture), 6 (Project Planning), 7 (Development Standards)

---

## 1. Purpose of This Document

Documents 1–7 tell you *what* to build and *why*. This document tells you exactly *what to type* to get a working environment, *every file you'll create*, and *what goes inside each one* — organized in the order you'll actually create them, phase by phase. Use this document open side-by-side with Document 6 (which phase you're on) and Document 7 (how to work) while you build.

---

## 2. Install These Before Writing Any Code

### 2.1 System-Level Tools (Install First)

| Tool | Why | Check install |
|---|---|---|
| Docker + Docker Compose | Runs every service (Architecture Doc §14) | `docker --version` / `docker compose version` |
| Python 3.11+ | Backend runtime | `python3 --version` |
| Node.js 20+ LTS | Frontend runtime | `node --version` |
| npm (bundled with Node) or pnpm | Frontend package manager | `npm --version` |
| Git | Version control (Document 7 §5) | `git --version` |
| A code editor with Python + TypeScript support | e.g., VS Code | — |

### 2.2 Backend Python Libraries (Install via `pip`/Poetry Inside `backend/`)

```bash
pip install fastapi "uvicorn[standard]" pydantic pydantic-settings \
  sqlalchemy alembic asyncpg psycopg2-binary pgvector \
  "python-jose[cryptography]" "passlib[bcrypt]" \
  redis rq \
  boto3 \
  sentence-transformers torch --index-url https://download.pytorch.org/whl/cpu \
  anthropic \
  python-multipart \
  pypdf python-docx \
  jinja2 httpx \
  resend \
  pytest pytest-asyncio pytest-cov \
  black ruff \
  --break-system-packages
```

| Library | Purpose | Which document justifies it |
|---|---|---|
| `fastapi`, `uvicorn` | Web framework + ASGI server | Architecture §4 |
| `pydantic`, `pydantic-settings` | Request/response schemas, `.env` loading | Architecture §14, Dev Standards §3 |
| `sqlalchemy`, `alembic` | ORM + migrations | Architecture §6 (data model) |
| `asyncpg` / `psycopg2-binary` | Postgres drivers | Architecture §4 |
| `pgvector` | Python bindings for the pgvector column type | Architecture §5 |
| `python-jose[cryptography]` | JWT encode/decode | Architecture §13 |
| `passlib[bcrypt]` | Password hashing | Security Doc §3 |
| `redis`, `rq` | Queue broker + background jobs | Architecture §8 |
| `boto3` | S3-compatible client for MinIO | Architecture §5 |
| `sentence-transformers`, `torch` (CPU build) | Local embedding model | Architecture §5, §9 |
| `anthropic` | LLM API calls for RAG answers | Architecture §9 |
| `python-multipart` | Required by FastAPI for file/form uploads | Document 2, FR-DOC-01 |
| `pypdf`, `python-docx` | Text extraction from PDF/DOCX | Architecture §8 |
| `jinja2` | Email template rendering | Architecture §12 |
| `httpx` | Async HTTP client (also used by FastAPI's `TestClient`) | Dev Standards §6 |
| `resend` | Example transactional email provider SDK (swap for `sendgrid`/`boto3` SES if you pick a different provider) | Architecture §5/§12 |
| `pytest`, `pytest-asyncio`, `pytest-cov` | Testing | Dev Standards §6 |
| `black`, `ruff` | Formatting/linting | Dev Standards §3 |

> **Note:** the `torch --index-url ... cpu` flag installs the much smaller CPU-only PyTorch build — you do not need a GPU build for v1 volume.

### 2.3 Frontend Node Libraries (Install via `npm` Inside `frontend/`)

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --eslint

cd frontend
npm install axios swr lucide-react clsx
npm install -D prettier
```

| Library | Purpose |
|---|---|
| `next`, `react`, `react-dom` (from `create-next-app`) | Frontend framework |
| `typescript` (from `create-next-app`) | Type safety (Dev Standards §4) |
| `tailwindcss` (from `create-next-app`) | Styling (Dev Standards §4) |
| `axios` | HTTP client used inside `lib/api-client.ts` |
| `swr` | Data fetching/caching for lists (documents, notifications, search results) |
| `lucide-react` | Icon set for UI (status badges, buttons) |
| `clsx` | Conditional className helper |
| `prettier` | Formatting, paired with ESLint from `create-next-app` |

### 2.4 External Accounts to Set Up Before Phase 5/6 (Not Needed for Phase 0)

| Account | Needed for | When |
|---|---|---|
| Anthropic API key | AI answer generation | Before Phase 5 |
| Transactional email provider (Resend, SendGrid, or SES) | Invite/notification emails | Before Phase 6 |
| Cloud VM provider (for later deployment) | Hosting | Before Phase 9 |

---

## 3. Complete Folder Structure (Full Detail)

```
collabai/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
├── README.md
├── docs/
│   ├── 01-product-vision-scope.md
│   ├── 02-srs.md
│   ├── 03-ux-product-design.md
│   ├── 04-technical-architecture.md
│   ├── 05-security-compliance.md
│   ├── 06-project-planning.md
│   ├── 07-development-standards.md
│   ├── 08-implementation-build-guide.md
│   └── adr/
│
├── backend/
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/                      (migration files, auto-generated)
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── core/
│   │   │   ├── security.py
│   │   │   ├── permission_filter.py
│   │   │   ├── logging.py
│   │   │   ├── deps.py
│   │   │   └── exceptions.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── workspace.py
│   │   │   ├── workspace_member.py
│   │   │   ├── invite.py
│   │   │   ├── project.py
│   │   │   ├── project_permission.py
│   │   │   ├── folder.py
│   │   │   ├── document.py
│   │   │   ├── document_version.py
│   │   │   ├── processing_job.py
│   │   │   ├── document_chunk.py
│   │   │   ├── conversation.py
│   │   │   ├── message.py
│   │   │   ├── ai_conversation.py
│   │   │   ├── ai_message.py
│   │   │   ├── comment.py
│   │   │   ├── notification.py
│   │   │   └── audit_log.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── workspace.py
│   │   │   ├── project.py
│   │   │   ├── document.py
│   │   │   ├── search.py
│   │   │   ├── ai.py
│   │   │   ├── comment.py
│   │   │   └── notification.py
│   │   ├── repositories/
│   │   │   ├── user_repo.py
│   │   │   ├── workspace_repo.py
│   │   │   ├── project_repo.py
│   │   │   ├── document_repo.py
│   │   │   ├── chunk_repo.py
│   │   │   ├── message_repo.py
│   │   │   ├── comment_repo.py
│   │   │   └── notification_repo.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── workspace_service.py
│   │   │   ├── project_service.py
│   │   │   ├── document_service.py
│   │   │   ├── processing_service.py
│   │   │   ├── search_service.py
│   │   │   ├── ai_service.py
│   │   │   ├── chat_service.py
│   │   │   ├── comment_service.py
│   │   │   ├── notification_service.py
│   │   │   ├── email_service.py
│   │   │   └── permission_service.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── workspaces.py
│   │   │   ├── projects.py
│   │   │   ├── documents.py
│   │   │   ├── search.py
│   │   │   ├── ai.py
│   │   │   ├── comments.py
│   │   │   ├── notifications.py
│   │   │   └── chat_ws.py
│   │   └── workers/
│   │       ├── worker_main.py
│   │       ├── process_document.py
│   │       ├── send_email.py
│   │       └── notify.py
│   └── tests/
│       ├── conftest.py
│       ├── unit/
│       │   ├── test_auth_service.py
│       │   ├── test_permission_service.py
│       │   └── test_ai_service.py
│       ├── integration/
│       │   ├── test_auth_routes.py
│       │   ├── test_workspace_routes.py
│       │   ├── test_document_routes.py
│       │   └── test_ai_routes.py
│       └── security/
│           ├── test_sec_t_01_no_direct_access_without_permission.py
│           ├── test_sec_t_02_search_excludes_restricted.py
│           ├── test_sec_t_03_ai_excludes_restricted.py
│           ├── test_sec_t_04_revoked_access_takes_effect_immediately.py
│           └── test_sec_t_05_role_downgrade_removes_admin_actions.py
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── workspaces/
    │   │   ├── page.tsx
    │   │   └── create/page.tsx
    │   └── w/
    │       └── [workspaceId]/
    │           ├── layout.tsx
    │           ├── members/page.tsx
    │           ├── settings/page.tsx
    │           └── projects/
    │               ├── page.tsx
    │               └── [projectId]/
    │                   ├── documents/page.tsx
    │                   ├── chat/page.tsx
    │                   ├── ai/page.tsx
    │                   └── settings/page.tsx
    ├── components/
    │   ├── StatusBadge.tsx
    │   ├── RoleBadge.tsx
    │   ├── Modal.tsx
    │   ├── Sidebar.tsx
    │   ├── Topbar.tsx
    │   ├── PaginatedList.tsx
    │   ├── CommentThread.tsx
    │   ├── CitationChip.tsx
    │   └── ConfirmDialog.tsx
    └── lib/
        ├── api-client.ts
        ├── auth.ts
        └── types.ts
```

---

## 4. What Goes In Each File (Detailed Descriptions)

### 4.1 Root-Level Files

| File | Contents |
|---|---|
| `docker-compose.yml` | Services: `caddy`, `frontend`, `api`, `worker`, `postgres` (image with pgvector, e.g. `pgvector/pgvector:pg16`), `redis`, `minio`. Volumes for Postgres data and MinIO data so data survives container restarts. |
| `docker-compose.prod.yml` | Overrides for production: real domain in Caddy config, resource limits, no bind-mounted source code (built images instead). |
| `.env.example` | Every variable from Architecture Doc §14.1, with blank/placeholder values and a comment above each explaining what it's for. |
| `.gitignore` | `.env`, `__pycache__/`, `*.pyc`, `node_modules/`, `.next/`, `*.db`, `.pytest_cache/`. |
| `README.md` | Setup instructions, `.env` variable table, how to run tests, how to deploy — kept current per Dev Standards §7. |

### 4.2 Backend — Core Application Files

| File | Contents |
|---|---|
| `backend/pyproject.toml` | Project metadata + pinned dependencies (Section 2.2 list) + tool config for `black`/`ruff`. |
| `backend/Dockerfile` | Python base image, installs `pyproject.toml` dependencies, copies `app/`, runs `uvicorn app.main:app`. |
| `backend/app/main.py` | Creates the `FastAPI()` app instance; includes all routers from `routers/`; registers the global exception handler (maps custom exceptions from `core/exceptions.py` to HTTP responses); adds the request-ID logging middleware; defines `/health`. |
| `backend/app/config.py` | A Pydantic `Settings` class that reads every `.env` variable with proper types (e.g., `ACCESS_TOKEN_EXPIRY_MINUTES: int`) — imported everywhere instead of raw `os.environ` calls. |

### 4.3 Backend — `core/` (Shared Infrastructure)

| File | Contents |
|---|---|
| `core/security.py` | Password hashing (`hash_password`, `verify_password` via passlib/bcrypt), JWT creation/verification (`create_access_token`, `decode_access_token`), refresh token generation + hashing. |
| `core/permission_filter.py` | **The single most important file in the codebase (Document 5 §5).** Contains `permission_filtered_project_ids(user_id) -> list[UUID]` and `can_access_document(user_id, document_id) -> bool`. Every place that reads documents/chunks/search results imports from here — nowhere else re-implements this logic. |
| `core/logging.py` | Configures structured JSON logging; defines the request-ID middleware that generates/propagates a request ID and attaches it to every log line in that request's lifecycle. |
| `core/deps.py` | FastAPI `Depends()` functions: `get_db()` (DB session), `get_current_user()` (decodes JWT from the `Authorization` header), `require_role(min_role)` (checks the role matrix from Security Doc §4.1). |
| `core/exceptions.py` | Custom exception classes: `PermissionDeniedError`, `NotFoundError`, `ValidationError`, `RateLimitedError` — raised by services, caught centrally in `main.py`. |

### 4.4 Backend — `models/` (One File Per Entity)

Each file defines one SQLAlchemy model class matching the table definitions in Architecture Doc §6.2 exactly — same field names, types, and relationships. For example, `models/document_chunk.py` defines the `DocumentChunk` class with an `embedding = Column(Vector(384))` field using the `pgvector` SQLAlchemy integration.

| File | Model |
|---|---|
| `user.py` | `User` |
| `workspace.py` | `Workspace` |
| `workspace_member.py` | `WorkspaceMember` |
| `invite.py` | `Invite` |
| `project.py` | `Project` |
| `project_permission.py` | `ProjectPermission` |
| `folder.py` | `Folder` |
| `document.py` | `Document` |
| `document_version.py` | `DocumentVersion` |
| `processing_job.py` | `ProcessingJob` |
| `document_chunk.py` | `DocumentChunk` (pgvector column) |
| `conversation.py` / `message.py` | Chat models |
| `ai_conversation.py` / `ai_message.py` | AI Q&A history models |
| `comment.py` | `Comment` |
| `notification.py` | `Notification` |
| `audit_log.py` | `AuditLog` (Security Doc §13) |

### 4.5 Backend — `schemas/` (Pydantic Request/Response Models)

Each file groups the request/response schemas for one resource area — e.g., `schemas/document.py` contains `DocumentUploadRequest`, `DocumentResponse`, `DocumentVersionResponse`. These are what routers actually accept/return (Dev Standards §3 — never return raw ORM objects).

| File | Contains schemas for |
|---|---|
| `auth.py` | Register, Login, TokenResponse, PasswordReset |
| `workspace.py` | Workspace CRUD, Invite, MemberRoleChange |
| `project.py` | Project CRUD, ProjectPermission toggling |
| `document.py` | Upload session request, Document/Version responses |
| `search.py` | Search query params, paginated results |
| `ai.py` | Ask request, streamed answer chunks, Citation, AIConversation history |
| `comment.py` | Comment CRUD, resolve/reopen |
| `notification.py` | Notification list/mark-read |

### 4.6 Backend — `repositories/` (Database Access Layer)

Each file contains plain functions that take a DB session and return ORM objects or run queries — no business logic, no permission checks (those live in `services/`). Example: `document_repo.py` has `get_by_id()`, `list_by_project()`, `soft_delete()`. This layer exists purely so `services/` and `routers/` never write raw SQLAlchemy queries inline (Dev Standards §2 rule).

### 4.7 Backend — `services/` (Business Logic)

| File | Responsibility |
|---|---|
| `auth_service.py` | Register/login/refresh/logout logic, calls `core/security.py`. |
| `workspace_service.py` | Workspace creation, invites (generates token, calls `email_service`), member management. |
| `project_service.py` | Project CRUD, sets `ProjectPermission` rows when a project is restricted. |
| `document_service.py` | Upload session creation (presigned MinIO URLs), download URL generation, soft-delete, version handling. |
| `processing_service.py` | Enqueues the `process_document` job (Architecture Doc §8) after upload confirmation. |
| `search_service.py` | Runs the full-text query, **imports `permission_filter.py`** to scope results (Security Doc §5.2). |
| `ai_service.py` | The RAG pipeline: embed question, pgvector similarity query (**also imports `permission_filter.py`**), prompt construction, Anthropic API call, citation parsing, persistence. |
| `chat_service.py` | Message persistence + Redis pub/sub publish (used by `routers/chat_ws.py`). |
| `comment_service.py` | Comment CRUD, resolve/reopen logic. |
| `notification_service.py` | Creates notification rows, enqueues email jobs for flagged notification types. |
| `email_service.py` | The `EmailSender` interface (Architecture Doc §12) — one function per provider (`send_via_resend`, etc.), selected by `EMAIL_PROVIDER` config. |
| `permission_service.py` | Wraps `require_role` checks used by routers; the "front door" to `core/permission_filter.py` for anything beyond simple role checks. |

### 4.8 Backend — `routers/` (HTTP Endpoints)

Each file registers a FastAPI `APIRouter()` with the endpoints from Architecture Doc §7's table for that resource group, using `Depends()` from `core/deps.py` for auth/role checks, calling into `services/`, and returning `schemas/` response models. `chat_ws.py` is the one router handling a WebSocket route instead of HTTP.

### 4.9 Backend — `workers/` (Background Jobs)

| File | Contents |
|---|---|
| `worker_main.py` | Entrypoint that starts the RQ worker process, listening on the configured queue(s). |
| `process_document.py` | The job function: extract text → chunk → embed (via `sentence-transformers`) → write `DocumentChunk` rows → update job status. Implements the idempotency/retry-safety logic from Architecture Doc §8. |
| `send_email.py` | The job function: renders a Jinja2 template, calls `email_service.py`, marks `emailed_at`. |
| `notify.py` | The job function: creates `Notification` rows, optionally enqueues `send_email` for high-value notification types. |

### 4.10 Backend — `tests/`

| Location | Contents |
|---|---|
| `conftest.py` | Shared pytest fixtures: test DB session, test client, factory functions for creating test users/workspaces/projects with specific permission setups. |
| `unit/` | Tests for individual service functions in isolation. |
| `integration/` | Tests hitting real endpoints via FastAPI's `TestClient` against a real (test) database. |
| `security/test_sec_t_*.py` | One file per SEC-T test from Security Doc §5.4 — named exactly to match, so they're never mistaken for generic tests. |

### 4.11 Frontend — App Router Pages

Each `page.tsx` corresponds directly to a screen in UX Doc §4's inventory. For example:
- `app/(auth)/login/page.tsx` → Screen 1 (Login)
- `app/w/[workspaceId]/projects/[projectId]/documents/page.tsx` → Screen 8 (Documents Tab), rendering the wireframe from UX Doc §6.1
- `app/w/[workspaceId]/projects/[projectId]/ai/page.tsx` → Screen 12 (AI Copilot Tab), rendering UX Doc §6.2, including the streaming answer + citation display
- `app/w/[workspaceId]/layout.tsx` → the persistent Workspace Shell (Sidebar + Topbar) wrapping every page under `/w/[workspaceId]/*`

### 4.12 Frontend — `components/`

| File | Contents |
|---|---|
| `StatusBadge.tsx` | Renders Ready/Processing/Failed/Pending with both color and text label (Accessibility, UX Doc §10). |
| `RoleBadge.tsx` | Renders Owner/Admin/Member. |
| `Modal.tsx` | Generic modal shell reused by Upload, Create Workspace/Project, Invite, Confirm-Delete. |
| `Sidebar.tsx` / `Topbar.tsx` | Workspace Shell navigation (UX Doc §3). |
| `PaginatedList.tsx` | Generic paginated list wrapper used by Documents, Chat history, Search results, Notifications. |
| `CommentThread.tsx` | One-level threaded comment display + reply/resolve controls. |
| `CitationChip.tsx` | Clickable numbered citation reference used in AI Copilot answers. |
| `ConfirmDialog.tsx` | Generic "are you sure?" dialog, reused for all irreversible actions. |

### 4.13 Frontend — `lib/`

| File | Contents |
|---|---|
| `api-client.ts` | A single `axios` instance with a base URL from env, request interceptor attaching the JWT, response interceptor handling 401 → refresh-token flow. **All** API calls in the app go through this file — never a raw `fetch()` in a component. |
| `auth.ts` | Token storage (e.g., httpOnly cookie or memory + refresh, per your chosen approach) and helper hooks (`useCurrentUser()`). |
| `types.ts` | TypeScript interfaces mirroring backend Pydantic schemas (kept manually in sync, or generated from the OpenAPI schema if you want to automate this later). |

---

## 5. Build Order: Files Per Phase (Cross-Referenced to Document 6)

This section tells you **which files from Section 3 to create, in which order, within each phase** — so you're never guessing what to build next.

### Phase 0 — Foundation
1. `docker-compose.yml` (skeleton services, no real logic yet)
2. `.env.example`, `.gitignore`, `README.md`
3. `backend/pyproject.toml`, `backend/Dockerfile`
4. `backend/app/main.py` (just `/health`), `backend/app/config.py`
5. `frontend/` scaffolded via `create-next-app` (Section 2.3)
6. `backend/tests/conftest.py` + one trivial test

### Phase 1 — Auth, Workspace, Project
1. `core/security.py`, `core/deps.py`, `core/exceptions.py`
2. Models: `user.py`, `workspace.py`, `workspace_member.py`, `invite.py`, `project.py`, `project_permission.py`
3. First Alembic migration (`alembic revision --autogenerate`)
4. Schemas: `auth.py`, `workspace.py`, `project.py`
5. Repositories: `user_repo.py`, `workspace_repo.py`, `project_repo.py`
6. Services: `auth_service.py`, `workspace_service.py`, `project_service.py`, `permission_service.py`
7. Routers: `auth.py`, `workspaces.py`, `projects.py` — wired into `main.py`
8. Frontend: `login/page.tsx`, `register/page.tsx`, `workspaces/page.tsx`, `workspaces/create/page.tsx`, `w/[workspaceId]/layout.tsx`, `w/[workspaceId]/members/page.tsx`, `w/[workspaceId]/projects/page.tsx`, `lib/api-client.ts`, `lib/auth.ts`
9. Tests: `unit/test_auth_service.py`, `integration/test_auth_routes.py`, `integration/test_workspace_routes.py`

### Phase 2 — File Storage
1. Models: `folder.py`, `document.py`, `document_version.py`
2. Migration update
3. Schemas: `document.py`
4. Repositories: `document_repo.py`
5. Services: `document_service.py` (MinIO presigned URLs via `boto3`)
6. Routers: `documents.py`
7. Frontend: `documents/page.tsx`, `components/StatusBadge.tsx`, `components/Modal.tsx` (used for Upload)
8. Tests: `integration/test_document_routes.py`

### Phase 3 — Background Processing
1. Models: `processing_job.py`, `document_chunk.py` (pgvector column — confirm the `pgvector` extension is enabled in the migration)
2. Migration update
3. Services: `processing_service.py`
4. Workers: `worker_main.py`, `process_document.py`
5. Update `document_service.py` to enqueue processing on upload-complete
6. Tests: worker idempotency test (kill mid-job, confirm no duplicate chunks)

### Phase 4 — Search
1. `core/permission_filter.py` — **written here for the first time**
2. Schemas: `search.py`
3. Services: `search_service.py`
4. Routers: `search.py`
5. Frontend: search UI (can live inside the Documents Tab or a dedicated search bar in the Topbar)
6. Tests: `security/test_sec_t_02_search_excludes_restricted.py`

### Phase 5 — AI Copilot / RAG
1. Models: `ai_conversation.py`, `ai_message.py`
2. Migration update
3. Schemas: `ai.py`
4. Services: `ai_service.py` (imports `core/permission_filter.py` from Phase 4 — does not reimplement it)
5. Routers: `ai.py` (streaming response)
6. Frontend: `ai/page.tsx`, `components/CitationChip.tsx`
7. Tests: `security/test_sec_t_01_...py`, `test_sec_t_03_...py`, `test_sec_t_04_...py`, `unit/test_ai_service.py`

### Phase 6 — Chat, Notifications, Email
1. Models: `conversation.py`, `message.py`, `notification.py`
2. Migration update
3. Repositories: `message_repo.py`, `notification_repo.py`
4. Services: `chat_service.py`, `notification_service.py`, `email_service.py` (real provider wired in now)
5. Workers: `send_email.py`, `notify.py`
6. Routers: `chat_ws.py`, `notifications.py`
7. Frontend: `chat/page.tsx`, `components/Sidebar.tsx` / `Topbar.tsx` notification badge
8. Tests: chat connection/auth test, email-sending mock test

### Phase 7 — Comments & Permissions UI
1. Models: `comment.py`
2. Migration update
3. Repositories: `comment_repo.py`
4. Services: `comment_service.py`
5. Routers: `comments.py`
6. Frontend: `components/CommentThread.tsx`, `w/[workspaceId]/projects/[projectId]/settings/page.tsx` (permissions UI)
7. Tests: `security/test_sec_t_05_role_downgrade_removes_admin_actions.py`

### Phase 8 — Hardening & Security Pass
1. Models: `audit_log.py`
2. Migration update
3. Wire audit logging into `permission_service.py` and role-changing endpoints
4. Re-run all `tests/security/*` together
5. `docker-compose.prod.yml` finalized
6. First backup/restore test performed

### Phase 9 — Launch Readiness
1. `core/logging.py` finalized end-to-end
2. Caddy config finalized with real domain
3. `README.md` finalized
4. Deploy to VM, verify Document 1 §6 success criteria live

---

## 6. Quick-Start Command Sequence (Phase 0 Only)

```bash
# 1. Scaffold
mkdir collabai && cd collabai
git init
mkdir -p backend/app/{core,models,schemas,repositories,services,routers,workers} backend/tests/{unit,integration,security} docs/adr

# 2. Backend deps (inside backend/)
cd backend
# create pyproject.toml, then:
pip install fastapi "uvicorn[standard]" pydantic pydantic-settings \
  sqlalchemy alembic asyncpg psycopg2-binary pgvector \
  "python-jose[cryptography]" "passlib[bcrypt]" redis rq boto3 \
  sentence-transformers torch --index-url https://download.pytorch.org/whl/cpu \
  anthropic python-multipart pypdf python-docx jinja2 httpx resend \
  pytest pytest-asyncio pytest-cov black ruff --break-system-packages
cd ..

# 3. Frontend scaffold
npx create-next-app@latest frontend --typescript --tailwind --app --eslint
cd frontend && npm install axios swr lucide-react clsx && npm install -D prettier
cd ..

# 4. Copy env template and fill in local values
cp .env.example .env

# 5. Bring up the stack
docker compose up -d

# 6. Confirm
curl http://localhost:8000/health
```

---

**This document is a companion to Documents 4, 6, and 7** — if anything here ever conflicts with those (e.g., you discover a better file split during implementation), update both this document and the relevant earlier one in the same commit, per Document 7 §7's "living documents" rule.
