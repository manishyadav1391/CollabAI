# CollabAI — Product Vision & Scope Document
**Document 1 of 7 | Version 1.0 | Status: Draft**
**Stack decided:** Python (FastAPI) backend · Next.js frontend · Single cloud VM (Docker Compose) deploy · Solo developer

---

## 1. Purpose of This Document

This document defines *what CollabAI v1 is*, *who it's for*, and — most importantly for a solo developer — *what it deliberately is not, yet*. Every later document (SRS, Architecture, Security, Planning, Standards) inherits the scope boundaries set here. If a feature isn't in this document's "v1 In Scope" list, it does not appear in the SRS either, no matter how tempting it is to add "just one more thing."

## 2. Product Vision

CollabAI is a workspace where a small team can store documents, chat, and ask an AI questions that get answered using their own documents — with the AI respecting who is allowed to see what.

The long-term vision (from the original brief) is a distributed system with real-time collaborative editing, OT/CRDT, sharded databases, and dozens of servers. **That is Phase 8–9 material.** v1 is a single deployable unit that proves the *product concept* end-to-end, not the *scale*.

## 3. Who Is This For (v1)

- **Primary user:** a small team (think 3–15 people) inside one workspace — e.g., a small company or a project team.
- **You are building this to learn**, so the "customer" is really you, but the product should behave like a genuinely usable internal tool, not a toy.

## 4. Guiding Principle for Scope Decisions

> **If a feature requires more than one server, more than one database instance, or a distributed-systems concept (sharding, multi-node pub/sub, CRDT) to work — it is future scope, not v1.**

This single rule is what keeps a solo developer from stalling. Every "Feature X" from the brief gets mapped to a phase below.

## 5. v1 Scope — What We're Actually Building

### In scope for v1 (the thing you will actually finish):

| Area | v1 Version |
|---|---|
| Auth | Register/login/logout, JWT access + refresh tokens, password hashing |
| Workspace | Create workspace, invite members (via email/link), 3 roles (Owner/Admin/Member) |
| Projects | Create/list/delete projects inside a workspace |
| Documents | Upload files (PDF/DOCX/TXT) directly to object storage, folders, download, delete |
| Document processing | Single background worker (not auto-scaled): extract text, chunk, embed, store vectors |
| AI Copilot | Ask a question, retrieve relevant chunks (permission-filtered), get an answer with citations |
| Chat | Real-time chat per project via a single WebSocket server |
| Comments | Comment on a document, resolve/reopen |
| Notifications | In-app notifications only (no email/push yet), generated via a queue |
| Search | Basic keyword search over document text (Postgres full-text search — not a separate search engine yet) |
| Permissions | Role-based access enforced at the API layer **and** at the AI retrieval layer (this is non-negotiable — see Security doc) |

### Explicitly OUT of scope for v1 (future phases):

| Feature | Why deferred | Target phase |
|---|---|---|
| Collaborative real-time document editing (OT/CRDT) | Genuinely hard distributed-systems problem; a single "locked while editing" model is fine for v1 | Phase 7 |
| Multiple chat/API servers + Pub/Sub | Needs more than one node to matter | Phase 8 |
| Dedicated search index (Elasticsearch/OpenSearch) | Postgres full-text search is enough at small scale | Phase 4 (later revision) |
| Database sharding/replication | Irrelevant below serious scale | Phase 8 |
| CDN for file delivery | Premature at 3–15 users | Phase 8 |
| Auto-scaling workers | One worker process is enough for v1 volume | Phase 8 |
| Email/push notifications | Adds an external service dependency; in-app is enough to prove the concept | Post-v1 |
| Distributed rate limiting | Single-instance rate limiting (in-memory or single Redis) is enough | Phase 9 (revisit) |
| Full observability stack (tracing across services) | One process = you can just read the logs | Phase 9 |

## 6. Success Criteria for v1

v1 is "done" when:
1. You can create a workspace, invite a teammate, and both of you can log in.
2. You can upload a PDF and it becomes searchable and askable within ~1 minute.
3. Asking the AI a question returns an answer with a citation to the correct document/page.
4. A user without permission to a document gets **no leakage** of that document's content via AI or search — verified with an explicit test case.
5. Two users can chat in real time in a project.
6. The whole thing runs via `docker-compose up` on a single cloud VM.

## 7. Constraints (Solo Developer + AI Subscription)

- **Time:** No fixed deadline, but each phase should be small enough to finish in days, not months.
- **Team:** You, plus an AI coding assistant. Documents in this series will include an AI-pairing workflow (see Development Standards, doc 7) so the AI subscription is used efficiently rather than generating code you don't understand.
- **Budget:** Free-tier cloud VM assumed; no paid managed services (no managed vector DB, no managed search) until v1 is proven — self-hosted equivalents (pgvector, Postgres FTS) are used instead. This will be made explicit in the Architecture doc.
- **AI/LLM costs:** Since you're on an AI subscription, LLM calls for the app itself (RAG answers) will likely go through a metered API (e.g., Anthropic API) — this is a real per-request cost to design around (caching, context limits), covered in the Architecture doc.

## 8. Open Questions Carried Forward

These will be resolved in later documents, not here:
- Exact vector storage approach (pgvector vs. separate vector DB) → Architecture doc.
- Object storage choice (self-hosted MinIO vs. cloud object storage) → Architecture doc.
- Specific LLM provider/model for RAG → Architecture doc.

## 9. Document Dependency Chain

```
1. Product Vision & Scope  (this document)
        ↓
2. Software Requirements Specification (SRS)
        ↓
3. UX / Product Design
        ↓
4. Technical Architecture
        ↓
5. Security & Compliance
        ↓
6. Project Planning (phases, milestones)
        ↓
7. Development Standards
        ↓
   → Start Phase 0 (empty repo)
```

---
**Next document:** Software Requirements Specification (SRS) — functional and non-functional requirements derived directly from the scope table in Section 5.
