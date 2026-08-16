# CollabAI — UX / Product Design Document
**Document 3 of 7 | Version 1.0 | Status: Draft**
**Stack:** Python (FastAPI) backend · Next.js frontend · Single cloud VM (Docker Compose) · Solo developer
**Derived from:** Document 2 — Software Requirements Specification (SRS)

---

## 1. Purpose of This Document

This document translates the functional requirements (FRs) from the SRS into **screens, navigation, and user flows**. It is wireframe-level (structure and behavior), not a visual mockup — no colors/fonts/pixel layouts yet. As a solo developer, you don't need a separate design tool for v1; this document is enough to start building Next.js pages directly.

Every screen and flow below references the FR IDs it satisfies, so if a screen doesn't map to an FR, it doesn't belong in v1.

## 2. Design Principles for v1

1. **One obvious path per task.** No competing ways to do the same thing — reduces both user confusion and your own implementation surface area.
2. **Never hide permission logic in the UI only.** If a user can't do something, the button doesn't render — but the backend enforces it regardless (FR-PERM-01). The UI is a convenience, not the security boundary.
3. **Show system state honestly.** Processing jobs, AI answers, and uploads all take time — the UI must show pending/processing/failed states, never pretend everything is instant.
4. **Defer visual polish.** Plain, clean, functional > beautiful. You can restyle later; you cannot easily retrofit a broken information architecture.

## 3. Information Architecture / Navigation Map

```
[Login / Register]
        │
        ▼
[Workspace Switcher] ──(create new)──▶ [Create Workspace]
        │
        ▼
┌───────────────────────────────────────────┐
│              WORKSPACE SHELL               │
│  Sidebar: Projects | Members | Settings    │
│  Topbar: Notifications | Workspace name    │
└───────────────────────────────────────────┘
        │
        ├──▶ [Project List] ──▶ [Project View]
        │                           │
        │                           ├──▶ [Documents Tab]
        │                           │        ├──▶ [Document Viewer + Comments]
        │                           │        └──▶ [Upload Modal]
        │                           │
        │                           ├──▶ [Chat Tab]
        │                           ├──▶ [AI Copilot Tab]
        │                           └──▶ [Project Settings] (permissions)
        │
        ├──▶ [Members] (invite/remove/roles)
        ├──▶ [Notifications Panel]
        └──▶ [Workspace Settings] (Owner only — includes Delete Workspace)
```

## 4. Screen Inventory

| # | Screen | Purpose | Primary Actions | Related FRs |
|---|---|---|---|---|
| 1 | Login | Authenticate | Log in, go to Register, Forgot password | FR-AUTH-01/02/05 |
| 2 | Register | Create account (standalone or via invite link) | Submit registration | FR-AUTH-01, FR-WS-03 |
| 3 | Workspace Switcher | Choose/create workspace | Select workspace, create new | FR-WS-01, FR-WS-07 |
| 4 | Create Workspace | New workspace setup | Name workspace, confirm | FR-WS-01 |
| 5 | Workspace Shell (layout) | Persistent nav for all workspace screens | Navigate sidebar/topbar | — (structural) |
| 6 | Project List | See all accessible projects | Open project, create project | FR-PRJ-01/02 |
| 7 | Project View (tabs) | Hub for one project | Switch tabs: Documents/Chat/AI/Settings | FR-PRJ-02 |
| 8 | Documents Tab | Browse/manage files | Upload, open folder, download, delete | FR-DOC-01–07 |
| 9 | Upload Modal | Upload a file with progress | Select file(s), see chunked progress | FR-DOC-01, FR-DOC-05, FR-PROC-05 |
| 10 | Document Viewer | View a document + its comments/status | View content, add comment, see processing status | FR-DOC-03, FR-CMT-01–04, FR-PROC-05/06 |
| 11 | Chat Tab | Real-time project chat | Send/receive messages, scroll history | FR-CHAT-01–04 |
| 12 | AI Copilot Tab | Ask questions, see cited answers | Ask, view streamed answer + citations, view history | FR-AI-01–07 |
| 13 | Search (global, top nav) | Keyword search within accessible scope | Search, paginate results | FR-SRCH-01–03 |
| 14 | Members | Manage workspace membership | Invite, remove, change role | FR-WS-02/04/05 |
| 15 | Project Settings (Permissions) | Restrict project/document visibility | Toggle member access | FR-PRJ-04, FR-PERM-02 |
| 16 | Workspace Settings | Workspace-level admin | Rename, delete workspace (Owner only) | FR-WS-06 |
| 17 | Notifications Panel | View/clear notifications | Mark read, click-through to source | FR-NOTIF-01–03 |

## 5. Key User Flows

### Flow A — First-Time Onboarding (FR-AUTH-01, FR-WS-01)
```
Register → Verify (if email verification enabled) → Land on Workspace Switcher
   → "No workspaces yet" empty state → Create Workspace → Land in empty Project List
```
**Empty state copy matters here** — a brand-new workspace with zero projects should clearly prompt "Create your first project," not show a blank confusing screen.

### Flow B — Invite a Teammate (FR-WS-02/03)
```
Owner/Admin → Members screen → "Invite" → enters email → system generates invite link
   → (out of band: link shared manually, since email sending may not exist yet in v1 — see Section 9 Open Decision)
   → Invitee opens link → Register (if new) or Login (if existing) → auto-joins workspace as Member
```

### Flow C — Upload and Ask AI About a Document (FR-DOC-01, FR-PROC-01–06, FR-AI-01–05)
```
Documents Tab → Upload Modal → select file → progress bar (chunked upload)
   → modal closes, document appears in list with status badge: "Processing..."
   → (async) badge updates to "Ready" or "Processing failed: <reason>"
   → User switches to AI Copilot Tab → types question → streamed answer appears
   → Each citation is a clickable reference back to the source document/page
```
**Critical UX detail:** the document status badge must be visible from the Documents list without opening the file — users will otherwise repeatedly ask the AI "why can't you see my file" while it's still processing.

### Flow D — Restricted Document, Permission Denied Gracefully (FR-PRJ-04, FR-AI-02, FR-SRCH-02)
```
Non-permitted Member searches a term → result set simply omits the restricted document
   (no "access denied" message, no indication it exists — true invisibility, not a blocked-access screen)
Same member asks AI a related question → AI either answers from permitted docs only,
   or responds "I don't have relevant information in the documents you have access to."
```
**Design decision:** we do NOT show "1 result hidden due to permissions." That would leak existence of the document. Silence is the correct UX for this security boundary — documented explicitly for the Security doc to confirm.

### Flow E — Real-Time Chat (FR-CHAT-01–04)
```
Open Project → Chat Tab → WebSocket connects → message history loads (paginated, most recent first)
   → user types + sends → message appears immediately (optimistic UI) with a pending indicator
   → confirmed via server ack → pending indicator clears
   → if delivery fails, message shows a retry option
```

### Flow F — Comment on a Document (FR-CMT-01–04)
```
Document Viewer → "Add comment" → type text → submit → comment appears in side panel thread
   → other member replies (one level of threading) → original author marks Resolved
   → Resolved comments collapse by default but remain viewable
```

### Flow G — Notification → Action (FR-NOTIF-01–03)
```
Event occurs (mention, upload, processing done) → Notification Worker creates notification
   → badge count increments in Topbar → user opens panel → clicks notification
   → navigates directly to the relevant Project/Document/Comment → marked read automatically
```

## 6. Wireframe-Level Screen Descriptions (Core Screens)

### 6.1 Project View — Documents Tab
```
┌─────────────────────────────────────────────────────────┐
│ [Project Name]      Documents | Chat | AI Copilot | ⚙   │
├─────────────────────────────────────────────────────────┤
│ [+ Upload]                              [Search box]     │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 📁 HR Policies                                      │   │
│ │   📄 Employee_Handbook.pdf     Ready       [⋮]      │   │
│ │   📄 Leave_Policy.docx         Processing… [⋮]      │   │
│ │ 📁 (root)                                           │   │
│ │   📄 Architecture.pdf          Ready       [⋮]      │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```
Each row: name, status badge, `[⋮]` menu (download/delete/version history if FR-DOC-07 implemented).

### 6.2 AI Copilot Tab
```
┌─────────────────────────────────────────────────────────┐
│ Ask a question about this project's documents            │
│ ┌───────────────────────────────────────────────────┐   │
│ │ > What is our annual leave policy?                  │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│ Employees receive 18 days of annual leave, accrued       │
│ monthly. Unused leave up to 5 days carries over. [1][2]  │
│                                                           │
│ Sources:                                                  │
│  [1] Employee_Handbook.pdf — p.23                         │
│  [2] Leave_Policy.docx — Section 4.2                      │
└─────────────────────────────────────────────────────────┘
```
Answer text streams in incrementally (FR-AI-07). Citations are numbered inline and listed below, each clickable.

### 6.3 Document Viewer (with Comments panel)
```
┌───────────────────────────────┬───────────────────────┐
│                                │ Comments (3)          │
│      [Document content /      │ ────────────────────  │
│       PDF preview]             │ Rahul: Should we      │
│                                │ support Google login?  │
│                                │   ↳ Manish: Yes.       │
│                                │      [Resolve]         │
│                                │ ────────────────────  │
│                                │ [+ Add comment]        │
└───────────────────────────────┴───────────────────────┘
```

### 6.4 Members Screen
```
┌─────────────────────────────────────────────────────────┐
│ Members                                    [+ Invite]    │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Manish   Owner                                      │   │
│ │ Rahul    Admin     [Change role ▾] [Remove]         │   │
│ │ Amit     Member    [Change role ▾] [Remove]         │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```
Role-change and Remove controls only render for Owner/Admin viewers (FR-PERM-01) — and are re-checked server-side regardless.

## 7. States & Edge Cases (Must Design For, Not Just Code For)

| Situation | Required UX Treatment |
|---|---|
| Empty workspace (no projects) | Prominent "Create your first project" prompt, not a blank list |
| Document still processing | Visible "Processing…" badge; AI/search silently exclude it until ready |
| Document processing failed | Badge shows "Processing failed" + reason; option to retry upload |
| AI has no answer | Explicit "I don't have relevant information in the documents you have access to" — never a fabricated guess |
| Search with zero results | "No results" — indistinguishable whether zero results is due to no match or permission filtering |
| WebSocket disconnected | Chat shows a subtle "Reconnecting…" indicator; messages queue locally and send on reconnect |
| Large file upload in progress | Progress bar with percentage; safe to navigate away (upload continues) |
| Session expired (token refresh fails) | Redirect to Login with "Your session expired, please log in again" — no silent failure |
| Owner tries to delete workspace | Explicit confirmation step (type workspace name, or similar friction) — irreversible action |

## 8. Responsive / Mobile Note

v1 targets **desktop browser only** (per SRS §2.3). Next.js pages should still use reasonably responsive layout (flexbox/grid, not fixed pixel widths) so mobile isn't actively broken — but no dedicated mobile UX pass is in scope for v1.

## 9. Reusable Component List (for Next.js implementation)

To avoid rebuilding the same thing five times, plan these as shared components from the start:

- `StatusBadge` (Ready / Processing / Failed / Pending)
- `RoleBadge` (Owner / Admin / Member)
- `Modal` (used for Upload, Create Workspace, Create Project, Invite, Confirm-Delete)
- `Sidebar` + `Topbar` (Workspace Shell layout)
- `PaginatedList` (used by Documents, Chat history, Search results, Notifications)
- `CommentThread` (used only in Document Viewer, but isolated as its own component)
- `CitationChip` (clickable citation reference, used in AI Copilot answers)
- `ConfirmDialog` (generic "are you sure?" — reused for delete workspace/project/document)

## 10. Accessibility Notes (Baseline, Not Exhaustive for v1)

- All interactive elements keyboard-reachable (tab order follows visual order).
- Status badges (Section 7) use both color **and** text label — never color alone (colorblind-safe).
- Form errors (login, upload, etc.) announced via visible inline text, not color-only.

## 11. Open Decisions Carried to Architecture / Security Docs

- **Invite delivery mechanism:** v1 SRS marks email/push notifications out of scope. Decide in Architecture doc whether invite links are emailed (requires an email-sending dependency) or manually copy/shared for v1 — recommend starting with a copyable link to avoid adding an email service dependency this early.
- **PDF preview rendering approach** (client-side PDF.js vs. server-rendered) — Architecture doc.

---

**Next document:** Technical Architecture Document — system architecture, data model, and API contracts, built to satisfy every screen and flow above using the confirmed stack (FastAPI + Next.js + single VM).
