"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import type { Project } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";

export function TrashModal({
  workspaceId,
  open,
  onClose,
  onRestored,
}: {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  onRestored: (project: Project) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    apiClient
      .get<Project[]>(`/workspaces/${workspaceId}/projects/trash`)
      .then(({ data }) => setProjects(data))
      .catch(() => setError("Failed to load trash"))
      .finally(() => setLoading(false));
  }, [open, workspaceId]);

  async function handleRestore(project: Project) {
    setBusyId(project.id);
    setError(null);
    try {
      await apiClient.post(`/projects/${project.id}/restore`);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      onRestored({ ...project, deleted_at: null });
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail ?? "Failed to restore project");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Trash">
      <p className="text-[13.5px] leading-[1.6] text-[var(--muted)]">
        Deleted projects stay here for 30 days before they&apos;re gone for good.
      </p>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {loading ? (
          <p className="text-[13px] text-[var(--faint)]">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="text-[13px] text-[var(--faint)]">Trash is empty.</p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--border)] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold text-[var(--text)]">{project.name}</div>
                <div className="text-[12px] text-[var(--faint)]">
                  Deleted {project.deleted_at ? formatRelativeTime(project.deleted_at) : "recently"}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={busyId === project.id}
                onClick={() => handleRestore(project)}
              >
                {busyId === project.id ? "Restoring…" : "Restore"}
              </Button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
