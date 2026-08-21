export type Avatar = {
  initials: string;
  name: string;
  gradient: string;
};

export const navDocs = [
  { name: "Q4-MSA.pdf", active: true },
  { name: "Board minutes — Nov", active: false },
  { name: "Security questionnaire", active: false },
  { name: "Pricing model v3.xlsx", active: false },
  { name: "Renewal playbook", active: false },
];

export const chatMessages: (Avatar & { text: string })[] = [
  { initials: "PR", name: "Priya", gradient: "linear-gradient(140deg,#7c6cff,#a855f7)", text: "Flagging §7.1 — cap moved to 4%." },
  { initials: "DK", name: "Dev", gradient: "linear-gradient(140deg,#a855f7,#22d3ee)", text: "Legal signed off this morning." },
  { initials: "AM", name: "Amara", gradient: "linear-gradient(140deg,#22d3ee,#7c6cff)", text: "Pulling the diff into the board pack." },
];

export const threadMessages: (Avatar & { time: string; text: string })[] = [
  { initials: "PR", name: "Priya", gradient: "linear-gradient(140deg,#7c6cff,#a855f7)", time: "10:02", text: "Is the 4% cap only for renewal terms or the whole agreement?" },
  { initials: "DK", name: "Dev", gradient: "linear-gradient(140deg,#a855f7,#22d3ee)", time: "10:04", text: "Renewal only — CollabAI pulled §7.1, quote is above." },
  { initials: "AM", name: "Amara", gradient: "linear-gradient(140deg,#22d3ee,#7c6cff)", time: "10:07", text: "Perfect. Resolving and adding it to the summary." },
];

export const logos = ["OpenAI", "Next.js", "Postgres", "pgvector", "Redis", "Vercel"];

export const permissions: { doc: string; scope: string; ok: boolean }[] = [
  { doc: "Q4-MSA.pdf", scope: "WORKSPACE", ok: true },
  { doc: "Board minutes — Nov", scope: "RESTRICTED", ok: false },
  { doc: "Comp bands 2026.pdf", scope: "RESTRICTED", ok: false },
  { doc: "Security questionnaire", scope: "WORKSPACE", ok: true },
];

export const starterFeatures = [
  "1 workspace",
  "Up to 3 users",
  "50 MB document storage",
  "Unlimited questions with citations",
  "Real-time chat and comments",
];

export const proFeatures = [
  "Unlimited projects",
  "Up to 15 users",
  "10 GB document storage",
  "Priority parsing queue",
  "Granular permission groups",
  "Audit log and export",
  "Bring your own model endpoint",
];

export const faqs: { q: string; a: string }[] = [
  {
    q: "Are my documents used to train your AI?",
    a: "No. Your files are processed to build a private index for your workspace only. They are never sent to a model provider for training, never pooled with other customers, and are deleted from storage within 24 hours of you deleting them in the app.",
  },
  {
    q: "What file types are supported?",
    a: "PDF, DOCX, PPTX, TXT and Markdown today, including scanned PDFs via OCR. Spreadsheets and email archives are next on the roadmap.",
  },
  {
    q: "How does the permission system work?",
    a: "Every document carries a scope: workspace-wide, group, or restricted. Scopes are applied at retrieval time, so a document you can't open also can't appear in an answer generated for you — no prompt can talk its way around it.",
  },
  {
    q: "How fast is processing?",
    a: "A 200-page PDF is parsed, chunked and embedded in seconds by background workers. You can keep chatting while it indexes; the document joins the answer set the moment it's ready.",
  },
  {
    q: "Can we self-host or use our own model?",
    a: "Pro workspaces can point CollabAI at your own model endpoint. Fully self-hosted deployments are available on the Enterprise plan.",
  },
];

export const demoQuestion = "What changed in our renewal terms between Q3 and Q4?";
export const demoAnswer =
  "Three terms moved between the Q3 and Q4 contracts. The auto-renewal notice window shortened from 60 days to 30 days [1], the annual uplift cap dropped from 7% to 4% [2], and termination for convenience became mutual rather than customer-only [3].";
