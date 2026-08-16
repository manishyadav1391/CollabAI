# CollabAI — Development Standards
**Document 7 of 7 | Version 1.0 | Status: Draft**
**Stack:** Python (FastAPI) backend · Next.js frontend · Single cloud VM (Docker Compose) · Solo developer
**Derived from:** Documents 1–6

---

## 1. Purpose of This Document

This document defines *how you actually work* day to day: repo layout, coding conventions, git workflow, testing standards, and — since this project is explicitly a learning exercise done with an AI subscription — a concrete workflow for pairing with an AI assistant without either over-relying on it or under-using it. Apply this starting at Phase 0 (Document 6), not retroactively.

## 2. Repository Structure

```
collabai/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── docs/                          ← Documents 1-7 live here, versioned with the code
│   ├── 01-product-vision-scope.md
│   ├── 02-srs.md
│   ├── 03-ux-product-design.md
│   ├── 04-technical-architecture.md
│   ├── 05-security-compliance.md
│   ├── 06-project-planning.md
│   ├── 07-development-standards.md
│   └── adr/                       ← Architecture Decision Records (see Section 8)
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py               ← loads/validates .env via Pydantic Settings
│   │   ├── routers/                ← one file per resource: auth.py, workspaces.py, projects.py, documents.py, search.py, ai.py, comments.py, notifications.py, chat_ws.py
│   │   ├── services/                ← business logic, one file per domain (auth_service.py, permission_service.py, ai_service.py, ...)
│   │   ├── repositories/            ← DB access layer (keeps routers/services free of raw ORM queries)
│   │   ├── models/                  ← SQLAlchemy models
│   │   ├── schemas/                 ← Pydantic request/response schemas
│   │   ├── workers/                 ← RQ job definitions (process_document.py, send_email.py, ...)
│   │   └── core/                    ← permission_filter.py (THE shared function from Doc 4/5), security.py (JWT/hashing), logging.py
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── security/                ← SEC-T-01 through SEC-T-05 live here explicitly, named plainly
│   ├── pyproject.toml
│   └── Dockerfile
└── frontend/
    ├── app/                         ← Next.js App Router pages, mirroring Document 3's screen inventory
    ├── components/                  ← shared components from Document 3 §9 (StatusBadge, Modal, PaginatedList, ...)
    ├── lib/
    │   ├── api-client.ts            ← single wrapper around fetch/axios; all API calls go through this
    │   └── types.ts                 ← shared TypeScript types matching backend Pydantic schemas
    ├── package.json
    └── Dockerfile
```

**Rule:** if you're about to write a raw SQL query inside a router function, or an `if user.role == "admin"` inline check outside `permission_service.py`, stop — that logic belongs in `services/` or `core/permission_filter.py` respectively (this is what makes Document 5 §4.2 and §5 actually true of the code, not just the docs).

## 3. Backend Coding Standards (Python / FastAPI)

| Area | Standard |
|---|---|
| Style | PEP 8, enforced automatically via `black` (formatting) + `ruff` (linting) — run both before every commit, ideally via a pre-commit hook. |
| Type hints | Required on all function signatures. FastAPI + Pydantic already push you this way — don't fight it with `Any` everywhere. |
| Request/response schemas | Every endpoint has an explicit Pydantic request model and response model — never return raw ORM objects or untyped dicts from a route. |
| Dependency injection | Use FastAPI's `Depends()` for: current user extraction from JWT, `require_role(min_role)`, and DB session — these should be reusable, not copy-pasted per router. |
| Layering | Routers call services; services call repositories; repositories touch the ORM. A router should never import SQLAlchemy directly. |
| Docstrings | One-line docstring on every service function explaining *why*, not *what* (the code already shows what) — especially in `permission_filter.py`, where the "why" (Document 5 §5) matters more than the "what." |
| Naming | `snake_case` throughout; boolean fields/functions prefixed `is_`/`has_` (`is_restricted`, `has_access`). |

## 4. Frontend Coding Standards (Next.js / React)

| Area | Standard |
|---|---|
| Language | TypeScript throughout — no plain `.jsx`/`.js` files; shared types in `lib/types.ts` kept in sync with backend schemas. |
| Component structure | Function components with hooks; one component per file; shared components (Document 3 §9) live in `components/`, screen-specific ones live alongside their page. |
| Styling | Pick one approach early (Tailwind is a reasonable default) and use it consistently — don't mix three styling approaches across screens. |
| API calls | All requests go through `lib/api-client.ts` — no inline `fetch()` calls scattered through components. This is where auth token attachment and refresh-on-401 logic lives, once, not per-component. |
| State management | React state/context is enough for v1's scope — don't introduce Redux/Zustand unless a genuine cross-cutting state need appears. |
| Naming | `PascalCase` for components, `camelCase` for functions/variables, files named after their default export (`StatusBadge.tsx` exports `StatusBadge`). |

## 5. Git Workflow

| Area | Standard |
|---|---|
| Branching | `main` is always deployable. Work happens on short-lived branches named `phase-N-short-description` (e.g., `phase-3-document-processing`), merged back to `main` when a phase's DoD (Document 6) is met — or smaller sub-feature branches within a phase if it's large (e.g., Phase 5 could be `phase-5-retrieval`, `phase-5-ui`). |
| Commit messages | [Conventional Commits](https://www.conventionalcommits.org/) style: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `security:` prefixes. A commit touching `permission_filter.py` should use `security:` regardless of what else it does, so it's easy to find later. |
| Commit size | Small, atomic commits over one giant "Phase 3 done" commit — you'll thank yourself when `git bisect` is the only way to find where a bug was introduced. |
| Tags | Tag `main` at the end of each phase (`v0.1-phase0`, `v0.2-phase1`, ...) so you can always check out "the state of the app right after Phase N." |
| Self-review before merge | Since you're solo, there's no second reviewer — so treat the Section 10 checklist below as your mandatory self-review gate before merging any branch, not an optional nicety. |

## 6. Testing Standards

| Test type | Location | Requirement |
|---|---|---|
| Unit tests | `backend/tests/unit/` | Services and permission logic tested in isolation (mocked DB where reasonable). |
| Integration tests | `backend/tests/integration/` | Real test database (a separate `docker-compose` test profile or SQLite for speed), hitting actual endpoints via FastAPI's `TestClient`. |
| Security tests | `backend/tests/security/` | **SEC-T-01 through SEC-T-05 (Document 5 §5.4) live here explicitly, named exactly as in that document** (`test_sec_t_01_no_direct_access_without_permission`, etc.) — this makes them impossible to lose track of and easy to point at when asked "did you test the permission boundary?" |
| Frontend tests | `frontend/` (Jest/React Testing Library) | Optional for v1 given solo-developer bandwidth — prioritize backend/security tests first; add frontend tests opportunistically for the trickiest components (e.g., the streaming AI answer display). |
| Coverage target | N/A as a hard number | Don't chase a coverage percentage. Instead: every FR in the SRS with a "Must" priority should have at least one test that exercises it, and every SEC-T test must exist and pass — that's the real bar, not a percentage. |
| Running tests | `pytest` locally and (ideally) via a simple CI step even without a dedicated CI/CD platform — a `pre-push` git hook running `pytest` is enough for a solo project. |

## 7. Documentation Standards

| Area | Standard |
|---|---|
| Living documents | Documents 1–7 in `docs/` are not "written once and forgotten" — if implementation reveals a document was wrong (e.g., an entity needs an extra field), update the document in the same PR as the code change. Stale docs are worse than no docs. |
| API documentation | FastAPI's auto-generated OpenAPI docs (`/docs`) are your API reference — keep Pydantic schemas accurate and descriptive (use `Field(description=...)`) rather than writing a separate hand-maintained API doc. |
| Architecture Decision Records (ADRs) | For any *significant* deviation from Document 4 discovered during implementation (e.g., "we switched from RQ to Celery because X"), add a short ADR in `docs/adr/NNN-title.md`: context, decision, consequences. Keeps future-you from wondering "wait, why did I do it this way?" |
| README | Kept current with: how to run locally, required `.env` variables (matching Architecture Doc §14.1 exactly), how to run tests, how to deploy. |

## 8. Error Handling & Logging Conventions

| Area | Standard |
|---|---|
| Exception handling | Define a small set of custom exceptions (`PermissionDeniedError`, `NotFoundError`, `ValidationError`) raised by services, caught once by a FastAPI exception handler that maps them to consistent HTTP responses — not `try/except` scattered per-router. |
| Logging | Structured (JSON) logs via Python's `logging` module configured once in `core/logging.py`. Every log line includes the request ID (Document 4/5 — NFR-10). |
| Never log | Passwords, tokens, API keys, full JWTs — enforce this by never logging raw request bodies for auth endpoints; log only non-sensitive fields explicitly. |
| Log levels | `INFO` for normal request flow, `WARNING` for handled edge cases (e.g., processing_failed), `ERROR` for unexpected exceptions, and a distinct log line for every SEC-relevant denial (e.g., a 403 from `require_role`) — these denial logs feed the audit log from Document 5 §13. |

## 9. Dependency & Environment Management

| Area | Standard |
|---|---|
| Python dependencies | `pyproject.toml` with pinned versions (Poetry or `pip-tools` — either is fine, just pick one and stick with it for the whole project). |
| Node dependencies | `package-lock.json` committed; avoid `^`/`~` surprises breaking a build months later — pin exact versions for anything security-sensitive (auth libraries). |
| Environment variables | Every variable in Architecture Doc §14.1 has a corresponding entry in `.env.example` (blank) — if you add a new variable during implementation, update `.env.example` in the same commit. |
| Local vs. production config | `docker-compose.yml` for local dev; a separate `docker-compose.prod.yml` overlay (or profile) for the VM deployment, differing mainly in Caddy config and any resource limits — avoid maintaining two entirely separate compose files that drift apart. |

## 10. Self-Review Checklist (Mandatory Before Merging Any Branch)

Since there's no second reviewer, this checklist *is* your code review:

- [ ] Does this change touch anything in `core/permission_filter.py` or a route that reads documents/search/AI? If yes — have you re-run the SEC-T tests (Document 5 §5.4)?
- [ ] Are all new endpoints using `require_role()`/auth dependencies rather than inline checks?
- [ ] Are secrets absent from the diff (`git diff` reviewed, not just assumed)?
- [ ] Do new DB-touching functions live in `repositories/`, not inline in a router?
- [ ] Is there at least one test for new "Must"-priority FR behavior?
- [ ] Does `.env.example` reflect any new environment variables?
- [ ] Would this still make sense to you in three months? (If not, add a comment or docstring now, not later.)

## 11. AI-Pairing Workflow (Using Your AI Subscription Deliberately)

This formalizes the workflow named in your original brief: *I give requirement → you design → you implement → you get stuck → you ask → I give a hint → you solve → we review → next concept.* Translated into a concrete day-to-day loop with an AI coding assistant:

### 11.1 The Loop, Per Task

1. **State the requirement to yourself first**, in your own words, referencing the specific FR/NFR/section from Documents 2–6. If you can't restate it, you're not ready to implement it yet — re-read the relevant document section first.
2. **Attempt a design/approach yourself** before asking the AI to write code — even a rough sketch of the function signature or the steps. This is the step that makes the exercise actually educational rather than transcription.
3. **When stuck, ask the AI a *specific* question** — not "write the auth service," but "I'm implementing refresh token rotation per Architecture Doc §13; here's my current approach [paste], what's wrong with how I'm checking expiry?" Specific questions get useful, checkable answers; vague ones get plausible-sounding code you won't fully understand.
4. **Read every line the AI gives you before accepting it.** If you don't understand a line, ask *why* it's there before moving on — this is non-negotiable for anything touching auth, permissions, or the RAG retrieval path (Document 5's most sensitive areas).
5. **Run it, test it, verify it against the relevant document's Definition of Done** (Document 6) — not "it ran once and looked fine."
6. **Only then move to the next task.**

### 11.2 What to Hand the AI Directly (Good Uses)

- Boilerplate that's well-specified by these documents (Pydantic schemas from Document 4 §6, route stubs from §7's endpoint table).
- Explaining an unfamiliar library/error message.
- A second pair of eyes on a specific function ("does this correctly filter by `permission_filtered_project_ids`? What's a case it might miss?").
- Writing test cases once you've described the scenario (especially useful for generating SEC-T test *scaffolding*, which you then verify actually tests what it claims to).

### 11.3 What Not to Outsource Entirely (Do It Yourself First)

- The permission-filtering logic itself (Document 5 §5) — you should write the first draft, then have the AI critique it, not the reverse. This is the one piece of the system where understanding *why* matters more than shipping fast.
- Any security-relevant design decision not already made in Document 5 — if a new one comes up during implementation, reason about it yourself first, write it down (as an ADR, §7), then sanity-check with the AI.
- The final judgment call on "is this phase actually done" — that's the Document 6 DoD checklist and your own testing, not a model's opinion that "this looks complete."

### 11.4 Cost-Awareness (You're on a Subscription, Not Pay-Per-Token API Access — But Still)

Even on a subscription, long, unfocused sessions with huge pasted context are less effective than focused ones. Per-task, prefer: paste only the relevant document section + relevant existing code, not the entire repo; ask one specific question at a time rather than "review my whole backend." This also happens to produce better answers, not just cheaper ones.

## 12. "Ready to Ship" Definition (Ties Sections 6, 10, and Document 6 Together)

A phase branch is ready to merge to `main` when, in order:
1. Document 6's Definition of Done for that phase is fully checked.
2. Section 10's self-review checklist is fully checked.
3. All tests pass locally (`pytest`, and any frontend tests present).
4. `.env.example` and the README are current.
5. The branch is tagged per Section 5 once merged.

---

## 13. How All Seven Documents Fit Together (Closing Summary)

| # | Document | Answers |
|---|---|---|
| 1 | Product Vision & Scope | What are we building, and what are we explicitly not building yet? |
| 2 | Software Requirements Specification | What must the system do, precisely, with IDs you can reference forever? |
| 3 | UX / Product Design | What does the user actually see and do, screen by screen? |
| 4 | Technical Architecture | How is it built, with which technologies, and why? |
| 5 | Security & Compliance | Where can this go wrong, and how do we prove it doesn't? |
| 6 | Project Planning | In what order do we build it, and how do we know when to stop each part? |
| 7 | Development Standards | How do we actually work, day to day, including with an AI assistant? |

You now have everything needed to start **Phase 0** from an empty repository. The natural next step outside this document series is implementation itself — when you're ready, we can begin Phase 0 (Foundation) together, following exactly the AI-pairing loop defined in Section 11: you state the requirement, attempt an approach, and bring me specific questions as they come up.
