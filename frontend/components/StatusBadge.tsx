type Status = "pending" | "processing" | "ready" | "processing_failed";

const LABELS: Record<Status, string> = {
  pending: "Pending",
  processing: "Processing…",
  ready: "Ready",
  processing_failed: "Failed",
};

const COLORS: Record<Status, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  processing: "bg-amber-50 text-amber-700",
  ready: "bg-green-50 text-green-700",
  processing_failed: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[status]}`}>
      {LABELS[status]}
    </span>
  );
}