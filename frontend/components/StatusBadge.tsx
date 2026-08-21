import type { DocumentStatus } from "@/lib/types";

const LABELS: Record<DocumentStatus, string> = {
  pending: "Queued",
  processing: "Extracting text…",
  ready: "Ready",
  processing_failed: "Processing failed",
};

const STYLES: Record<DocumentStatus, { bg: string; color: string }> = {
  pending: { bg: "var(--bg-2)", color: "var(--muted)" },
  processing: { bg: "var(--amber-bg)", color: "var(--amber)" },
  ready: { bg: "var(--green-bg)", color: "var(--green)" },
  processing_failed: { bg: "var(--red-bg)", color: "var(--red)" },
};

export function StatusBadge({ status, reason }: { status: DocumentStatus; reason?: string | null }) {
  const { bg, color } = STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-[6px] rounded-[100px] px-[10px] py-[4px] font-mono text-[10px] font-bold tracking-[.05em] uppercase"
      style={{ background: bg, color }}
      title={status === "processing_failed" ? (reason ?? "Processing failed") : undefined}
    >
      {status === "processing" && (
        <span
          className="h-[7px] w-[7px] animate-spin rounded-full border-[1.5px] border-current"
          style={{ borderRightColor: "transparent" }}
        />
      )}
      {LABELS[status]}
    </span>
  );
}
