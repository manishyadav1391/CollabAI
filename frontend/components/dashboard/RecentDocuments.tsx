import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRelativeTime } from "@/lib/format";
import type { DocumentStatus } from "@/lib/types";
import { SparklesIcon } from "@/components/dashboard/icons";

export type RecentDocument = {
  id: string;
  filename: string;
  projectId: string;
  projectName: string;
  status: DocumentStatus;
  uploadedAt: string;
};

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-[14px]">
      <div className="h-[13px] w-1/3 animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="h-[13px] w-[110px] animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="ml-auto h-[13px] w-[90px] animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="h-[22px] w-[70px] animate-pulse rounded-full bg-[var(--panel-3)]" />
    </div>
  );
}

export function RecentDocuments({
  documents,
  workspaceId,
  loading,
}: {
  documents: RecentDocument[];
  workspaceId: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="divide-y divide-[var(--border)] overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[var(--sh-1)]">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-[18px] border border-dashed border-[var(--border-2)] bg-white px-6 py-12 text-center">
        <p className="text-[14px] text-[var(--muted)]">
          No documents yet. Upload a file into a project to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[var(--sh-1)]">
      <div className="hidden grid-cols-[1fr_180px_140px_120px_90px] gap-4 border-b border-[var(--border)] bg-[var(--panel-2)] px-5 py-[10px] font-mono text-[10.5px] font-bold tracking-[.05em] text-[var(--faint)] uppercase sm:grid">
        <span>Document</span>
        <span>Project</span>
        <span>Updated</span>
        <span>Status</span>
        <span />
      </div>
      <div className="divide-y divide-[var(--border)]">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group grid grid-cols-1 gap-2 px-5 py-[14px] sm:grid-cols-[1fr_180px_140px_120px_90px] sm:items-center sm:gap-4"
          >
            <span className="truncate text-[13.5px] font-semibold text-[var(--text)]">{doc.filename}</span>
            <Link
              href={`/w/${workspaceId}/projects/${doc.projectId}/documents`}
              className="truncate text-[13px] text-[var(--muted)] hover:text-[var(--accent-soft)]"
            >
              {doc.projectName}
            </Link>
            <span className="text-[12.5px] text-[var(--faint)]">{formatRelativeTime(doc.uploadedAt)}</span>
            <span>
              <StatusBadge status={doc.status} />
            </span>
            <Link
              href={`/w/${workspaceId}/projects/${doc.projectId}/ai?document=${doc.id}`}
              className="inline-flex items-center gap-[6px] justify-self-start rounded-[100px] border border-[var(--border-2)] bg-white px-[10px] py-[5px] text-[11.5px] font-semibold text-[var(--accent-soft)] opacity-0 shadow-[var(--sh-1)] transition-opacity group-hover:opacity-100 sm:justify-self-end"
            >
              <SparklesIcon size={12} stroke="var(--accent-soft)" />
              Ask AI
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
