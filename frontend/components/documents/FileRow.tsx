"use client";

import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";
import { formatBytes, formatRelativeTime } from "@/lib/format";
import type { Document } from "@/lib/types";
import { MoreHorizontalIcon } from "@/components/dashboard/icons";
import { DownloadIcon, TrashIcon } from "@/components/documents/icons";

function RowMenu({ documentId, onDelete }: { documentId: string; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    setDownloading(true);
    apiClient
      .get<{ download_url: string }>(`/documents/${documentId}/download-url`)
      .then(({ data }) => {
        window.open(data.download_url, "_blank", "noopener,noreferrer");
      })
      .finally(() => {
        setDownloading(false);
        setOpen(false);
      });
  }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[var(--faint)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--muted)]"
        aria-label="File options"
      >
        <MoreHorizontalIcon size={15} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-[170px] overflow-hidden rounded-[12px] border border-[var(--border)] bg-white py-[6px] shadow-[var(--sh-2)]">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex w-full items-center gap-[9px] px-4 py-[9px] text-left text-[13px] text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
          >
            <DownloadIcon size={14} />
            {downloading ? "Preparing…" : "Download"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-[9px] px-4 py-[9px] text-left text-[13px] text-[var(--red)] hover:bg-[var(--red-bg)]"
          >
            <TrashIcon size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function FileRow({
  doc,
  selected,
  uploaderLabel,
  onSelect,
  onOpen,
  onDelete,
}: {
  doc: Document;
  selected: boolean;
  uploaderLabel: string;
  onSelect: () => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const version = doc.current_version;
  const isReady = version?.status === "ready";

  return (
    <div
      role="row"
      tabIndex={-1}
      onClick={onSelect}
      onDoubleClick={onOpen}
      className="grid cursor-pointer grid-cols-[1fr_100px_140px_160px_40px] items-center gap-4 border-b border-[var(--border)] px-5 py-[13px] transition-colors last:border-b-0 sm:grid"
      style={{ background: selected ? "var(--panel-2)" : "transparent" }}
    >
      <span className="truncate text-[13.5px] font-semibold text-[var(--text)]">
        {version?.filename ?? "Untitled"}
      </span>
      <span className="text-[12.5px] text-[var(--muted)]">
        {version ? formatBytes(version.size_bytes) : "—"}
      </span>
      <span className="truncate text-[12.5px] text-[var(--muted)]">
        {uploaderLabel} · {version ? formatRelativeTime(version.uploaded_at) : ""}
      </span>
      <span>{!isReady && version && <StatusBadge status={version.status} reason={version.failure_reason} />}</span>
      <RowMenu documentId={doc.id} onDelete={onDelete} />
    </div>
  );
}
