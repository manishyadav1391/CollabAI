# CollabAI — Project Planning Document
**Document 6 of 7 | Version 1.0 | Status: Draft**
**Stack:** Python (FastAPI) backend · Next.js frontend · Single cloud VM (Docker Compose) · Solo developer
**Derived from:** Documents 1–5 (Vision, SRS, UX, Architecture, Security)

---

## 1. Purpose of This Document

This document sequences everything defined in Documents 1–5 into buildable phases sized for one developer working with an AI coding assistant. Each phase has a **Definition of Done (DoD)** — a concrete, checkable condition, not a vibe — so you always know whether to keep working on a phase or move to the next one.

**Important re-numbering note:** the original brief's Phases 0–9 assumed the full distributed end-state. Since v1 (Document 1) deliberately excludes OT/CRDT collaborative editing and distributed scaling, this plan **repurposes** phase numbers 7–9 for v1-appropriate work (permissions UI, hardening, launch readiness) rather than leaving them empty. The true "Phase 7/8/9" content from the original brief becomes the **Future Roadmap** in Section 12 — not deleted, just correctly deferred.

## 2. Planning Principles for a Solo Developer + AI Subscription

1. **A phase is done when its DoD is checked, not when it feels finished.** Perfectionism is the main way solo projects stall — the DoD exists to give you permission to move on.
2. **Each phase should be finishable in days, not weeks.** If a phase's DoD looks like it needs more than ~2 weeks of part-time effort, it's too big — split it.
3. **Working software over complete software.** At the end of every phase, the system should still run end-to-end (even if later phases aren't built yet) — never leave the app in a broken intermediate state between phases for long.
4. **Use the AI assistant as a pair programmer per Document 7's workflow** (next document) — but you drive; don't accept generated code you don't understand, because you're building this specifically to learn.
5. **Security tests are not a separate phase.** The SEC-T tests (Document 5 §5.4) are embedded directly into the phases where their preconditions first exist — see Phase 5.

## 3. Phase Overview (Master Sequence)

| Phase | Name | Core Question It Answers |
|---|---|---|
| 0 | Foundation | Can I develop and run something at all? |
| 1 | Auth, Workspace, Project | Can users log in and organize their team? |
| 2 | File Storage | Can users upload and manage files? |
| 3 | Background Processing | Can uploaded files become searchable/embeddable? |
| 4 | Search | Can users find things by keyword, correctly permission-scoped? |
| 5 | AI Copilot / RAG | Can users ask AI questions, safely and with citations? |
| 6 | Real-Time Chat, Notifications, Email | Can the team communicate and stay informed? |
| 7 | Comments & Permissions UI | Can users discuss documents and control who sees what, end-to-end? |
| 8 | Hardening & Security Pass | Is it actually safe to use with real data? |
| 9 | Launch Readiness | Can I run this reliably without babysitting it? |

## 4. Phase 0 — Foundation

**Goal:** A working, empty, deployable skeleton.

**Deliverables:**
- Git repository initialized, with `.gitignore` covering `.env`, `node_modules`, `__pycache__`, etc.
- `docker-compose.yml` skeleton with empty/hello-world versions of: `api` (FastAPI), `frontend` (Next.js), `postgres`, `redis`, `minio`.
- Basic project structure for the FastAPI app (routers/, models/, services/, tests/ folders) and Next.js app (per Document 7's conventions — see next document).
- `.env.example` populated with every variable from Architecture Doc §14.1 (blank values).
- Logging configured (structured JSON logs with request ID placeholder).
- A single passing test (even a trivial one) to confirm the test runner works.

**Definition of Done:**
- [ ] `docker-compose up` starts all containers without error.
- [ ] FastAPI's `/health` endpoint returns 200.
- [ ] Next.js dev server renders a placeholder page.
- [ ] `pytest` runs and passes at least one test.
- [ ] A commit history exists (don't wait until "it's good enough" to start committing).

**Effort:** Small (a few sessions). **Common pitfall:** over-engineering the folder structure before you know what you need — keep it minimal and let Phase 1 shape it.

## 5. Phase 1 — Authentication, Workspace, Project

**Covers:** FR-AUTH-01–07, FR-WS-01–07, FR-PRJ-01–04, FR-PERM-01 (the RBAC matrix from Document 5 §4.1).

**Why permissions belong this early:** the `ProjectPermission` model and the role-check dependency (`require_role`) need to exist before Phase 4/5 build search and AI retrieval on top of them. Building permissions as an afterthought is exactly the anti-pattern Document 5 §5.3 warns against.

**Deliverables:**
- User registration/login/refresh/logout, password hashing, JWT issuance (Architecture Doc §13).
- Workspace CRUD, membership, role management.
- Invite model created (token generation) — **email sending itself can be stubbed/logged to console in this phase**; wire up the real email provider in Phase 6 to avoid blocking on provider signup this early.
- Project CRUD, `ProjectPermission` model, and the shared `require_role()` dependency used by every protected route from here on.
- Basic Next.js pages: Login, Register, Workspace Switcher, Create Workspace, Project List, Members screen (Document 3 §4, screens 1–6, 14).

**Definition of Done:**
- [ ] A user can register, log in, create a workspace, and see themselves as Owner.
- [ ] A second (test) user can be invited, and — even via a stubbed/logged invite token for now — can join as Member.
- [ ] Role matrix (Document 5 §4.1) is enforced: a Member calling an Admin-only endpoint gets 403.
- [ ] Automated tests exist for: registration, login, token refresh, and at least one role-enforcement case.

**Effort:** Medium.

## 6. Phase 2 — File Storage

**Covers:** FR-DOC-01–07.

**Deliverables:**
- MinIO integrated; presigned upload/download URL endpoints.
- Document/DocumentVersion/Folder models.
- Chunked/resumable upload support for large files (FR-DOC-05).
- Documents Tab UI (Document 3 §6.1) with status badges (even though processing doesn't exist yet — badge can just show "Uploaded" for now).

**Definition of Done:**
- [ ] A user can upload a PDF/DOCX/TXT directly to MinIO (not through the API server's memory).
- [ ] A user can download a file they have access to, and gets denied (per Phase 1's permission model) for one they don't.
- [ ] A >20MB file uploads successfully via chunked upload.
- [ ] Document version history works for a re-uploaded file (if implementing FR-DOC-07 — Could-priority, skip if time-constrained).

**Effort:** Medium. **Common pitfall:** routing the file through the FastAPI server instead of true direct-to-storage upload — re-check Architecture Doc §14 (presigned URLs) if this creeps in.

## 7. Phase 3 — Background Processing (Extraction, Chunking, Embeddings)

**Covers:** FR-PROC-01–06.

**Deliverables:**
- RQ worker container wired to Redis queue.
- Text extraction for PDF/DOCX/TXT.
- Chunking logic (with page/section reference retained for citations later).
- Local embedding model (`sentence-transformers`) integrated in the worker; embeddings written to `DocumentChunk.embedding` (pgvector column).
- Job status tracking (`pending → processing → completed/failed`) with idempotency key handling (Architecture Doc §8).
- Status badge in the Documents Tab now reflects real processing state.

**Definition of Done:**
- [ ] Uploading a document automatically triggers processing without any manual step.
- [ ] A `DocumentChunk` row with a populated embedding vector exists for each chunk after processing completes.
- [ ] Killing the worker mid-job and restarting it does not create duplicate chunks (test this directly — don't just assume the idempotency key works).
- [ ] A deliberately malformed file fails gracefully with `processing_failed` + a reason, without crashing the worker (FR-DOC-06).

**Effort:** Medium–Large — this phase has the most moving parts (extraction library quirks per file type are the usual time sink).

## 8. Phase 4 — Search

**Covers:** FR-SRCH-01–03, and the first real use of the shared permission filter.

**Deliverables:**
- Postgres full-text search index (`tsvector`/GIN) on document text.
- `permission_filtered_project_ids()` function — **written once here, imported (not reimplemented) in Phase 5.**
- Search endpoint and UI (paginated results).

**Definition of Done:**
- [ ] Keyword search returns results only from documents in projects the user can access.
- [ ] **SEC-T-02** (Document 5 §5.4): a term existing only in a restricted document returns zero results for a non-permitted user — write this test now, not later.
- [ ] Search results are paginated.

**Effort:** Small–Medium.

## 9. Phase 5 — AI Copilot / RAG

**Covers:** FR-AI-01–07. This is the phase the whole project has been building toward.

**Deliverables:**
- `/ai/ask` endpoint: embed question → pgvector similarity search filtered by the **same** `permission_filtered_project_ids()` from Phase 4 → construct prompt → call Anthropic API with streaming → parse citations → persist `AIMessage`.
- Prompt template implementing the injection mitigation from Document 5 §11.2 (retrieved content wrapped in explicit untrusted-context markers).
- AI Copilot Tab UI (Document 3 §6.2) with streaming answer display and clickable citations.
- Rate limiting on the AI endpoint (NFR-09).

**Definition of Done — all of Document 5 §5.4's tests pass before this phase is considered complete:**
- [ ] **SEC-T-01**: non-permitted direct document access denied.
- [ ] **SEC-T-03**: AI question about a restricted document returns the FR-AI-05 fallback for a non-permitted user, and a real cited answer for a permitted user — **this is the single most important test in the entire project.**
- [ ] **SEC-T-04**: revoking access immediately blocks AI/search on the next request.
- [ ] Streaming answers render token-by-token in the UI.
- [ ] Citations link back to the correct document and page/section.
- [ ] AI conversation history is saved and viewable (FR-AI-06).

**Effort:** Large. **Do not shortcut the security tests here** — this is the phase where a real leak is both most likely and most damaging to the product's core promise.

## 10. Phase 6 — Real-Time Chat, Notifications, Email

**Covers:** FR-CHAT-01–04, FR-NOTIF-01–03, and the email architecture from Document 4 §12 (this phase is where the real email provider gets wired in, replacing Phase 1's stub).

**Deliverables:**
- WebSocket endpoint with auth + project-membership validation (Document 5 §9).
- Redis pub/sub wiring for message fan-out (already-correct design even at single-instance scale — Architecture Doc §11).
- Message persistence with sequence numbers (FR-CHAT-03).
- Notification generation via queue for: mentions, uploads, added-to-project, processing done/failed.
- Real email provider integrated (Resend/SendGrid/SES — pick one) behind the `EmailSender` interface; invite emails and password reset emails now actually send.
- Chat Tab and Notifications Panel UI (Document 3 §4).

**Definition of Done:**
- [ ] Two logged-in users in the same project see each other's messages in real time.
- [ ] Reconnecting after a dropped WebSocket connection resumes without message loss (paginated history reload).
- [ ] An invite triggers a real email with a working join link.
- [ ] A notification (e.g., mention) appears in-app and, if flagged for email, also arrives by email.

**Effort:** Medium–Large.

## 11. Phase 7 — Comments & Permissions UI

**Covers:** FR-CMT-01–04, and the UI layer for FR-PRJ-04 (permission model already existed since Phase 1 — this phase is about exposing it properly in the interface).

**Deliverables:**
- Comment CRUD with one level of threading, resolve/reopen.
- Document Viewer UI with comments panel (Document 3 §6.3).
- Project Settings screen for toggling restricted visibility (Document 3 §4, screen 15) — the UI counterpart to the backend model built in Phase 1.

**Definition of Done:**
- [ ] Comments can be added, replied to once, resolved, and reopened.
- [ ] An Owner/Admin can mark a project or document restricted to specific members via the UI, and **SEC-T-05** (role/permission change takes effect immediately) still passes end-to-end through this new UI path.

**Effort:** Small–Medium.

> **Note on the original brief's Phase 7:** collaborative real-time document editing (OT/CRDT) was Document 1's explicit example of "future scope" — it is not built here. See Section 12.

## 12. Phase 8 — Hardening & Security Pass

**Covers:** Document 5 in full — this phase is where you formally work through the Pre-Launch Security Checklist (Document 5 §14) rather than treating security as done because individual SEC-T tests passed during earlier phases.

**Deliverables:**
- Full re-run of all SEC-T-01–05 tests together, plus any regression from later phases (e.g., does Phase 7's new permissions UI path still enforce the same backend checks?).
- Rate limiting verified on auth and AI endpoints.
- CORS locked down to production frontend origin.
- `.env`/secrets audit (confirm nothing ever committed — check git history).
- First real backup taken (Postgres `pg_dump` + MinIO snapshot) **and a restore actually tested** — an untested backup is not a backup.
- Audit log (Document 5 §13) verified to capture role changes, removals, restriction changes, deletions.

**Definition of Done:**
- [ ] Every checkbox in Document 5 §14 is checked.
- [ ] A restore-from-backup has been performed at least once successfully.

**Effort:** Small–Medium, but don't skip it because it doesn't produce a visible new feature — this phase is what makes the product trustworthy.

> **Note on the original brief's Phase 8 (Scale):** load balancers, multiple API servers, sharding, and auto-scaling are Document 1's explicit future scope — not built here. See Section 13.

## 13. Phase 9 — Launch Readiness

**Covers:** NFR-10 (observability), final NFR verification, deployment to the actual VM.

**Deliverables:**
- Structured logging with request IDs confirmed working end-to-end (API → worker → DB, per Architecture Doc §14).
- Deployment to the real cloud VM via `docker-compose up -d` behind Caddy with a real domain and HTTPS.
- Final pass against Document 1 §6's success criteria and Document 2 §8's acceptance table.
- Basic README covering setup, `.env` variables, and how to run locally vs. production.

**Definition of Done:**
- [ ] All six success criteria in Document 1 §6 are demonstrably true on the deployed system, not just locally.
- [ ] A fresh clone of the repo + a populated `.env` + `docker-compose up -d` produces a fully working system (NFR-12) — test this on a clean machine/VM if possible, since "works on my machine" is the classic solo-dev trap.

**Effort:** Small.

> **Note on the original brief's Phase 9 (Production):** distributed tracing, circuit breakers, and multi-region disaster recovery are future scope. See Section 13.

## 14. Future Roadmap (Explicitly Deferred, Not Forgotten)

These are preserved from the original brief and Document 1 §5's "out of scope" table — revisit only after v1 is live and you want the next learning challenge:

| Future Phase | Content | Trigger to Revisit |
|---|---|---|
| Collaborative Editing | OT or CRDT-based real-time document editing | When simultaneous editing conflicts become a real user complaint |
| Scale-Out | Multiple API/WebSocket servers, Redis-backed cross-node pub/sub (already architecturally ready per Doc 4 §15), sharding, read replicas, CDN, auto-scaling | When user count or load genuinely exceeds what one VM handles |
| Production Hardening at Scale | Distributed tracing, circuit breakers, multi-region DR, dedicated search engine, managed vector DB | Same trigger as Scale-Out, or when contractual/compliance requirements demand it |

## 15. How This Plan Uses Your AI Subscription

Each phase above is sized to be a good unit of AI-assisted work: small enough to hold in context, large enough to be a meaningful milestone. Document 7 (Development Standards, next) will define the specific workflow for pairing with an AI assistant per phase — but the short version: use the AI to generate and explain, use yourself to decide and verify, and never merge code whose security-relevant logic (especially anything touching Section 5's permission filter) you haven't personally traced through.

---

**Next document:** Development Standards — repo conventions, coding style, git workflow, testing standards, and the concrete AI-pairing workflow referenced above.
