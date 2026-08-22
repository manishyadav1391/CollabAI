"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { useProjectContext } from "@/lib/hooks/useProjectContext";
import { getCurrentUserId } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { TOPBAR_HEIGHT } from "@/components/dashboard/Topbar";
import { ArrowLeftIcon } from "@/components/documents/icons";
import { DocumentStage } from "@/components/viewer/DocumentStage";
import { CommentsPanel } from "@/components/viewer/CommentsPanel";
import { VersionHistoryModal } from "@/components/viewer/VersionHistoryModal";
import { MessageIcon, SparkleIcon } from "@/components/ui/icons";

const MAX_QUOTE_LENGTH = 300;

function quoteFromParam(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.length > MAX_QUOTE_LENGTH ? `${raw.slice(0, MAX_QUOTE_LENGTH)}…` : raw;
  return `> ${trimmed.replace(/\n+/g, " ")}\n\n`;
}

export default function DocumentViewerPage() {
  return (
    <Suspense>
      <DocumentViewerPageInner />
    </Suspense>
  );
}

function DocumentViewerPageInner() {
  const { workspaceId, projectId, documentId } = useParams<{
    workspaceId: string;
    projectId: string;
    documentId: string;
  }>();
  const searchParams = useSearchParams();
  const initialPage = searchParams.get("page") ? Number(searchParams.get("page")) : null;
  const initialComment = quoteFromParam(searchParams.get("quote"));
  const { documents, loading, reuploadFile, reload } = useDocuments(projectId);
  const { memberName } = useProjectContext(workspaceId, projectId);
  const currentUserId = getCurrentUserId();
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const reuploadInputRef = useRef<HTMLInputElement>(null);

  const doc = documents.find((d) => d.id === documentId);
  const filesHref = `/w/${workspaceId}/projects/${projectId}/documents`;

  if (loading) {
    return (
      <div
        className="flex items-center justify-center text-[13px] text-[var(--faint)]"
        style={{ height: `calc(100vh - ${TOPBAR_HEIGHT}px)` }}
      >
        Loading document…
      </div>
    );
  }

  if (!doc) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 text-center"
        style={{ height: `calc(100vh - ${TOPBAR_HEIGHT}px)` }}
      >
        <p className="text-[14px] text-[var(--muted)]">This document couldn&apos;t be found.</p>
        <Link href={filesHref} className="text-[13.5px] font-semibold text-[var(--accent-soft)]">
          ← Back to documents
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: `calc(100vh - ${TOPBAR_HEIGHT}px)` }}>
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] bg-white px-5 py-[10px]">
        <Link
          href={filesHref}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[var(--muted)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
          aria-label="Back to documents"
        >
          <ArrowLeftIcon size={16} />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-[14.5px] font-bold text-[var(--text)]">
          {doc.current_version?.filename ?? "Untitled document"}
        </h1>
        {doc.current_version && doc.current_version.status !== "ready" && (
          <StatusBadge status={doc.current_version.status} reason={doc.current_version.failure_reason} />
        )}

        <button
          type="button"
          onClick={() => setVersionHistoryOpen(true)}
          className="flex shrink-0 items-center gap-[6px] rounded-[8px] px-[10px] py-[6px] text-[12.5px] font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
        >
          Version history
        </button>
        <button
          type="button"
          onClick={() => reuploadInputRef.current?.click()}
          className="flex shrink-0 items-center gap-[6px] rounded-[8px] px-[10px] py-[6px] text-[12.5px] font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
        >
          Upload new version
        </button>
        <input
          ref={reuploadInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) reuploadFile(doc.id, doc.folder_id, file);
            e.target.value = "";
          }}
        />

        <span className="h-5 w-px shrink-0 bg-[var(--border)]" />

        <Link
          href={`/w/${workspaceId}/projects/${projectId}/ai?document=${doc.id}`}
          className="flex shrink-0 items-center gap-[6px] rounded-[8px] px-[10px] py-[6px] text-[12.5px] font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
        >
          <SparkleIcon size={13} />
          Ask AI
        </Link>
        <Link
          href={`/w/${workspaceId}/projects/${projectId}/chat`}
          className="flex shrink-0 items-center gap-[6px] rounded-[8px] px-[10px] py-[6px] text-[12.5px] font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
        >
          <MessageIcon size={13} />
          Chat
        </Link>
      </div>

      <Group orientation="horizontal" className="min-h-0 flex-1">
        <Panel defaultSize="70" minSize="40" className="min-w-0">
          {doc.current_version ? (
            <DocumentStage key={doc.id} documentId={doc.id} version={doc.current_version} initialPage={initialPage} />
          ) : (
            <div className="flex h-full items-center justify-center bg-[var(--bg-2)] text-[13px] text-[var(--faint)]">
              Preparing document…
            </div>
          )}
        </Panel>
        <Separator className="w-[2px] shrink-0 cursor-col-resize bg-[var(--border)] transition-colors hover:bg-[var(--accent)] focus-visible:bg-[var(--accent)] focus-visible:outline-none" />
        <Panel defaultSize="30" minSize="22" maxSize="45" className="min-w-0">
          <CommentsPanel
            key={doc.id}
            documentId={doc.id}
            resolveAuthor={(userId) => memberName(userId, currentUserId)}
            initialText={initialComment}
          />
        </Panel>
      </Group>

      <VersionHistoryModal
        documentId={doc.id}
        open={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        onRestored={reload}
      />
    </div>
  );
}
