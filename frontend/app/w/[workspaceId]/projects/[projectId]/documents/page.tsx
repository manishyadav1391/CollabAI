"use client";

import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useProjectContext } from "@/lib/hooks/useProjectContext";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { getCurrentUserId } from "@/lib/auth";
import { ProjectPageHeader } from "@/components/projects/ProjectPageHeader";
import { DropzoneOverlay } from "@/components/documents/DropzoneOverlay";
import { FileTable } from "@/components/documents/FileTable";
import { EmptyFilesState } from "@/components/documents/EmptyFilesState";
import { Toast } from "@/components/ui/Toast";
import { SearchIcon, FolderPlusIcon } from "@/components/dashboard/icons";
import { UploadIcon } from "@/components/documents/icons";

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-[var(--border)] px-5 py-[15px] last:border-b-0">
      <div className="h-[13px] flex-1 animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="h-[13px] w-[70px] animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="h-[13px] w-[110px] animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="h-[20px] w-[90px] animate-pulse rounded-full bg-[var(--panel-3)]" />
    </div>
  );
}

export default function DocumentsPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const { workspaceName, project, memberName } = useProjectContext(workspaceId, projectId);
  const { documents, loading, uploadFiles, deleteDocument } = useDocuments(projectId);

  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = getCurrentUserId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => d.current_version?.filename.toLowerCase().includes(q));
  }, [documents, query]);

  function resolveUploader(userId: string) {
    return memberName(userId, currentUserId);
  }

  function handleDelete(documentId: string) {
    const doc = documents.find((d) => d.id === documentId);
    const name = doc?.current_version?.filename ?? "this document";
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    deleteDocument(documentId).then(() => setToast("Document deleted"));
  }

  return (
    <div className="flex flex-col">
      <ProjectPageHeader
        workspaceId={workspaceId}
        projectId={projectId}
        workspaceName={workspaceName}
        projectName={project?.name ?? ""}
      />

      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-6 py-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[24px] font-extrabold tracking-[-.02em] text-[var(--text)]">Documents</h1>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-[260px]">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--faint)]">
                <SearchIcon size={14} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search files…"
                className="w-full rounded-[10px] border border-[var(--border)] bg-white py-[8px] pr-3 pl-9 text-[13px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--faint)] focus:border-[var(--accent)]"
              />
            </div>

            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex cursor-not-allowed items-center gap-[7px] rounded-[var(--r)] border border-[var(--border)] bg-[var(--panel-2)] px-4 py-[9px] text-[13.5px] font-semibold text-[var(--faint)]"
            >
              <FolderPlusIcon size={15} />
              New folder
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-[7px] rounded-[var(--r)] px-4 py-[9px] text-[13.5px] font-semibold text-white shadow-[var(--sh-accent)] transition-transform hover:-translate-y-0.5 bg-[image:var(--grad)]"
            >
              <UploadIcon size={15} stroke="#fff" />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : documents.length === 0 ? (
          <EmptyFilesState onUpload={() => fileInputRef.current?.click()} />
        ) : filtered.length === 0 ? (
          <p className="rounded-[16px] border border-dashed border-[var(--border-2)] bg-white px-6 py-16 text-center text-[13.5px] text-[var(--muted)]">
            No files match &quot;{query}&quot;.
          </p>
        ) : (
          <FileTable
            documents={filtered}
            workspaceId={workspaceId}
            projectId={projectId}
            resolveUploader={resolveUploader}
            onDelete={handleDelete}
          />
        )}
      </div>

      <DropzoneOverlay label={project?.name || "this project"} onDrop={uploadFiles} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
