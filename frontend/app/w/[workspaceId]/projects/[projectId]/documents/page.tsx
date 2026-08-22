"use client";

import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { useProjectContext } from "@/lib/hooks/useProjectContext";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { useFolders } from "@/lib/hooks/useFolders";
import { getCurrentUserId } from "@/lib/auth";
import { ProjectPageHeader } from "@/components/projects/ProjectPageHeader";
import { DropzoneOverlay } from "@/components/documents/DropzoneOverlay";
import { FileTable } from "@/components/documents/FileTable";
import { EmptyFilesState } from "@/components/documents/EmptyFilesState";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { SearchIcon, FolderPlusIcon, FolderIcon } from "@/components/dashboard/icons";
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
  const { folders, createFolder, deleteFolder } = useFolders(projectId);

  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderError, setNewFolderError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = getCurrentUserId();

  const q = query.trim().toLowerCase();

  const childFolders = useMemo(() => {
    if (q) return [];
    return folders.filter((f) => f.parent_folder_id === currentFolderId);
  }, [folders, currentFolderId, q]);

  const breadcrumbTrail = useMemo(() => {
    const trail: { id: string; name: string }[] = [];
    let cursor = currentFolderId;
    while (cursor) {
      const folder = folders.find((f) => f.id === cursor);
      if (!folder) break;
      trail.unshift({ id: folder.id, name: folder.name });
      cursor = folder.parent_folder_id;
    }
    return trail;
  }, [folders, currentFolderId]);

  const filtered = useMemo(() => {
    const scoped = q ? documents : documents.filter((d) => d.folder_id === currentFolderId);
    if (!q) return scoped;
    return scoped.filter((d) => d.current_version?.filename.toLowerCase().includes(q));
  }, [documents, currentFolderId, q]);

  function resolveUploader(userId: string) {
    return memberName(userId, currentUserId);
  }

  function handleDelete(documentId: string) {
    const doc = documents.find((d) => d.id === documentId);
    const name = doc?.current_version?.filename ?? "this document";
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    deleteDocument(documentId).then(() => setToast("Document deleted"));
  }

  function handleDeleteFolder(e: React.MouseEvent, folderId: string, name: string) {
    e.stopPropagation();
    if (!window.confirm(`Delete folder "${name}"?`)) return;
    deleteFolder(folderId)
      .then(() => setToast("Folder deleted"))
      .catch((err) => {
        const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
        setToast(detail ?? "Couldn't delete folder");
      });
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    setNewFolderError(null);
    if (!newFolderName.trim()) return;
    try {
      await createFolder(newFolderName.trim(), currentFolderId);
      setNewFolderName("");
      setNewFolderOpen(false);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setNewFolderError(detail ?? "Failed to create folder");
    }
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
              onClick={() => setNewFolderOpen(true)}
              className="flex items-center gap-[7px] rounded-[var(--r)] border border-[var(--border)] bg-[var(--panel-2)] px-4 py-[9px] text-[13.5px] font-semibold text-[var(--text)] transition-colors hover:border-[var(--border-2)] hover:bg-[var(--panel-3)]"
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
                if (e.target.files?.length) uploadFiles(e.target.files, currentFolderId);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {!q && breadcrumbTrail.length > 0 && (
          <div className="flex min-w-0 flex-wrap items-center gap-[6px] text-[13.5px]">
            <button
              type="button"
              onClick={() => setCurrentFolderId(null)}
              className="text-[var(--muted)] hover:text-[var(--text)]"
            >
              All files
            </button>
            {breadcrumbTrail.map((crumb, i) => {
              const isLast = i === breadcrumbTrail.length - 1;
              return (
                <span key={crumb.id} className="flex items-center gap-[6px]">
                  <span className="text-[var(--faint)]">/</span>
                  {isLast ? (
                    <span className="font-semibold text-[var(--text)]">{crumb.name}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrentFolderId(crumb.id)}
                      className="text-[var(--muted)] hover:text-[var(--text)]"
                    >
                      {crumb.name}
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        )}

        {childFolders.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {childFolders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setCurrentFolderId(folder.id)}
                className="group flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-white px-4 py-[14px] text-left transition-colors hover:border-[var(--accent)]"
              >
                <FolderIcon size={18} stroke="var(--accent)" />
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-[var(--text)]">
                  {folder.name}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleDeleteFolder(e, folder.id, folder.name)}
                  className="shrink-0 rounded-[6px] px-[6px] py-[2px] text-[11px] text-[var(--faint)] opacity-0 transition-opacity hover:text-[var(--red)] group-hover:opacity-100"
                >
                  Delete
                </span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : documents.length === 0 && childFolders.length === 0 ? (
          <EmptyFilesState onUpload={() => fileInputRef.current?.click()} />
        ) : filtered.length === 0 ? (
          q ? (
            <p className="rounded-[16px] border border-dashed border-[var(--border-2)] bg-white px-6 py-16 text-center text-[13.5px] text-[var(--muted)]">
              No files match &quot;{query}&quot;.
            </p>
          ) : null
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

      <Modal
        open={newFolderOpen}
        onClose={() => {
          setNewFolderOpen(false);
          setNewFolderName("");
          setNewFolderError(null);
        }}
        title="New folder"
      >
        <form onSubmit={handleCreateFolder} className="flex flex-col gap-4">
          <Field label="Folder name">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Contracts"
              autoFocus
            />
          </Field>
          {newFolderError && <Banner>{newFolderError}</Banner>}
          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create folder</Button>
          </div>
        </form>
      </Modal>

      <DropzoneOverlay label={project?.name || "this project"} onDrop={(files) => uploadFiles(files, currentFolderId)} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
