"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Document } from "@/lib/types";
import { FileRow } from "@/components/documents/FileRow";

const HEADER_COLS = ["Name", "Size", "Uploaded by", "AI status", ""];

export function FileTable({
  documents,
  workspaceId,
  projectId,
  resolveUploader,
  onDelete,
}: {
  documents: Document[];
  workspaceId: string;
  projectId: string;
  resolveUploader: (userId: string) => string;
  onDelete: (documentId: string) => void;
}) {
  const router = useRouter();
  const [pickedId, setPickedId] = useState<string | null>(null);

  // Derived rather than synced via effect: falls back to the first row
  // whenever the picked id isn't (or is no longer) in the current list —
  // e.g. after a delete, or when a search filters it out.
  const selectedId = pickedId && documents.some((d) => d.id === pickedId) ? pickedId : (documents[0]?.id ?? null);

  function openDocument(id: string) {
    router.push(`/w/${workspaceId}/projects/${projectId}/documents/${id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (documents.length === 0) return;
    const index = documents.findIndex((d) => d.id === selectedId);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setPickedId(documents[Math.min(documents.length - 1, index + 1)].id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setPickedId(documents[Math.max(0, index - 1)].id);
    } else if (e.key === "Enter" && selectedId) {
      e.preventDefault();
      openDocument(selectedId);
    }
  }

  return (
    <div
      role="table"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-white outline-none focus-visible:border-[var(--accent)]"
    >
      <div className="hidden grid-cols-[1fr_100px_140px_160px_40px] gap-4 border-b border-[var(--border)] bg-[var(--panel-2)] px-5 py-[10px] font-mono text-[10.5px] font-bold tracking-[.05em] text-[var(--faint)] uppercase sm:grid">
        {HEADER_COLS.map((col) => (
          <span key={col}>{col}</span>
        ))}
      </div>
      {documents.map((doc) => (
        <FileRow
          key={doc.id}
          doc={doc}
          selected={doc.id === selectedId}
          uploaderLabel={resolveUploader(doc.created_by)}
          onSelect={() => setPickedId(doc.id)}
          onOpen={() => openDocument(doc.id)}
          onDelete={() => onDelete(doc.id)}
        />
      ))}
    </div>
  );
}
