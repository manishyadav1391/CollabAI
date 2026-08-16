# CollabAI

An AI-powered collaborative workspace — documents, real-time chat, and an AI copilot that answers questions grounded in your team's own files, with permissions enforced end-to-end.

This is a **v1 / single-VM build**. See [`docs/01-product-vision-scope.md`](docs/01-product-vision-scope.md) for what's in scope and what's deliberately deferred.

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+ / FastAPI |
| Frontend | Next.js (TypeScript, App Router, Tailwind) |
| Database | PostgreSQL 16 + `pgvector` |
| Queue / Cache | Redis + RQ |
| Object storage | MinIO (S3-compatible) |
| Embeddings | Local `sentence-transformers` (CPU) |
| LLM (AI answers) | Anthropic API |
| Email | Resend / SendGrid / SES (configurable) |
| Reverse proxy | Caddy (auto HTTPS) |
| Deployment | Docker Compose, single cloud VM |

Full architecture rationale: [`docs/04-technical-architecture.md`](docs/04-technical-architecture.md).

---

## Project Documentation

This repo is built from a full planning document set in [`docs/`](docs/) — read these in order if you're new to the project:

| # | Document | Covers |
|---|---|---|
| 1 | [Product Vision & Scope](docs/01-product-vision-scope.md) | What v1 is and isn't |
| 2 | [Software Requirements Specification](docs/02-srs.md) | Functional/non-functional requirements (FR/NFR IDs) |
| 3 | [UX / Product Design](docs/03-ux-product-design.md) | Screens, flows, wireframes |
| 4 | [Technical Architecture](docs/04-technical-architecture.md) | System design, data model, API contracts |
| 5 | [Security & Compliance](docs/05-security-compliance.md) | Permission model, required security tests |
| 6 | [Project Planning](docs/06-project-planning.md) | Phases 0–9, Definition of Done per phase |
| 7 | [Development Standards](docs/07-development-standards.md) | Coding conventions, git workflow, AI-pairing workflow |
| 8 | [Implementation & File Build Guide](docs/08-implementation-build-guide.md) | Exact folder structure, file-by-file contents, install commands |

**These are living documents** — if implementation reveals something in `docs/` was wrong, fix the doc in the same commit as the code (Document 7 §7).

---

## Prerequisites

Install these before doing anything else (full detail in [Document 8 §2](docs/08-implementation-build-guide.md#2-install-these-before-writing-any-code)):

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 20+ LTS](https://nodejs.org/)
- Git

### External accounts (needed later, not for initial setup)

| Account | Needed for | Required by |
|---|---|---|
| [Anthropic API key](https://console.anthropic.com/) | AI Copilot answers | Phase 5 |
| Email provider (Resend / SendGrid / SES) | Invite & notification emails | Phase 6 |
| Cloud VM provider | Production hosting | Phase 9 |

---

## Getting Started (Local Development)

### 1. Clone and configure environment

```bash
git clone <this-repo-url> collabai
cd collabai
cp .env.example .env
```

Open `.env` and fill in the values described in the table below. For local development, most can stay as their local/default values — only `ANTHROPIC_API_KEY` (Phase 5+) and email provider keys (Phase 6+) require real external values.

### 2. Install backend dependencies

```bash
cd backend
pip install -e . --break-system-packages   # or use Poetry if configured in pyproject.toml
cd ..
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Start the full stack

```bash
docker compose up -d
```

This brings up: `caddy`, `frontend`, `api`, `worker`, `postgres` (with `pgvector`), `redis`, `minio`.

### 5. Run database migrations

```bash
docker compose exec api alembic upgrade head
```

### 6. Verify it's running

```bash
curl http://localhost:8000/health
```

Open the frontend at `http://localhost:3000`.

---

## Environment Variables

All variables below must exist in `.env` (see `.env.example` for the authoritative, always-up-to-date list). Full rationale in [Architecture Doc §14.1](docs/04-technical-architecture.md).

| Variable | Purpose | Required from |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | Phase 0 |
| `REDIS_URL` | Redis connection string | Phase 0 |
| `JWT_SECRET` | Signs access tokens — use a strong random value, never commit a real one | Phase 1 |
| `ACCESS_TOKEN_EXPIRY_MINUTES` | Access token lifetime (default `15`) | Phase 1 |
| `REFRESH_TOKEN_EXPIRY_DAYS` | Refresh token lifetime (default `30`) | Phase 1 |
| `MINIO_ENDPOINT` | MinIO server address | Phase 2 |
| `MINIO_ACCESS_KEY` | MinIO access key | Phase 2 |
| `MINIO_SECRET_KEY` | MinIO secret key | Phase 2 |
| `MINIO_BUCKET` | Bucket name for document storage | Phase 2 |
| `ANTHROPIC_API_KEY` | LLM API key for AI Copilot answers | Phase 5 |
| `EMBEDDING_MODEL_NAME` | Local embedding model (default `all-MiniLM-L6-v2`) | Phase 3 |
| `EMAIL_PROVIDER` | `resend` \| `sendgrid` \| `ses` | Phase 6 |
| `EMAIL_API_KEY` | API key for the chosen email provider | Phase 6 |
| `EMAIL_FROM_ADDRESS` | Sender address for outgoing email | Phase 6 |
| `FRONTEND_BASE_URL` | Used to build invite/reset links in emails | Phase 6 |

**Never commit a populated `.env` file.** Only `.env.example` (with blank values) is tracked in git.

---

## Running Tests

```bash
cd backend
pytest                          # all tests
pytest tests/unit                # unit tests only
pytest tests/integration         # integration tests only
pytest tests/security            # SEC-T-01 through SEC-T-05 — see below
```

### Security tests (non-negotiable)

`backend/tests/security/` contains five tests defined in [Security Doc §5.4](docs/05-security-compliance.md#54-required-automated-tests-non-negotiable-before-any-release) that verify the permission-filtering boundary between users, search, and the AI Copilot. These must pass before any phase touching documents, search, or AI is considered complete — see [Project Planning §5.4](docs/06-project-planning.md) and the [Pre-Launch Security Checklist](docs/05-security-compliance.md#14-pre-launch-security-checklist-non-negotiable).

```bash
pytest tests/security -v
```

---

## Project Structure

See [Document 8 §3](docs/08-implementation-build-guide.md#3-complete-folder-structure-full-detail) for the complete, authoritative folder tree. High-level:

```
collabai/
├── docs/          ← planning documents (this README's companions)
├── backend/       ← FastAPI app, workers, tests
└── frontend/      ← Next.js app
```

The single most important file in the backend is `backend/app/core/permission_filter.py` — every code path that reads documents, runs search, or retrieves context for the AI Copilot goes through this one function. See [Security Doc §5](docs/05-security-compliance.md) for why this matters.

---

## Development Workflow

- **Branching:** `main` is always deployable; work happens on `phase-N-description` branches (see [Dev Standards §5](docs/07-development-standards.md)).
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) style (`feat:`, `fix:`, `security:`, etc.).
- **Before merging any branch:** run through the [self-review checklist](docs/07-development-standards.md#10-self-review-checklist-mandatory-before-merging-any-branch) — there's no second reviewer on a solo project, so this checklist is the review.
- **Working with an AI assistant:** see the [AI-pairing workflow](docs/07-development-standards.md#11-ai-pairing-workflow-using-your-ai-subscription-deliberately) — state the requirement yourself, attempt a design, ask specific questions, read every line before accepting it.

---

## Deployment

Production uses the same `docker-compose.yml` plus a `docker-compose.prod.yml` overlay (real domain in Caddy config, resource limits, built images rather than bind-mounted source):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Before deploying for real, confirm every item in the [Pre-Launch Security Checklist](docs/05-security-compliance.md#14-pre-launch-security-checklist-non-negotiable) is checked, and that a backup has been taken **and restored successfully at least once**.

---

## Current Status

<!-- Update this section as you complete each phase — see docs/06-project-planning.md -->

- [ ] Phase 0 — Foundation
- [ ] Phase 1 — Auth, Workspace, Project
- [ ] Phase 2 — File Storage
- [ ] Phase 3 — Background Processing
- [ ] Phase 4 — Search
- [ ] Phase 5 — AI Copilot / RAG
- [ ] Phase 6 — Real-Time Chat, Notifications, Email
- [ ] Phase 7 — Comments & Permissions UI
- [ ] Phase 8 — Hardening & Security Pass
- [ ] Phase 9 — Launch Readiness

---

## License

_Not yet decided — add your license here before making this repo public._
