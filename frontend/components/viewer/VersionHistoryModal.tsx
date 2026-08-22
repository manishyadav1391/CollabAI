"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { formatBytes, formatRelativeTime } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { StatusBadge } from "@/components/StatusBadge";
import type { DocumentStatus } from "@/lib/types";

type VersionListItem = {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: DocumentStatus;
  failure_reason: string | null;
  uploaded_at: string;
  is_current: boolean;
};

export function VersionHistoryModal({
  documentId,
  open,
  onClose,
  onRestored,
}: {
  documentId: string;
  open: boolean;
  onClose: () => void;
  onRestored: () => void;
}) {
  const [versions, setVersions] = useState<VersionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    apiClient
      .get<VersionListItem[]>(`/documents/${documentId}/versions`)
      .then(({ data }) => setVersions(data))
      .catch(() => setError("Failed to load version history"))
      .finally(() => setLoading(false));
  }, [open, documentId]);

  async function handleRestore(version: VersionListItem) {
    setBusyId(version.id);
    setError(null);
    try {
      await apiClient.post(`/documents/${documentId}/versions/${version.id}/restore`);
      setVersions((prev) => prev.map((v) => ({ ...v, is_current: v.id === version.id })));
      onRestored();
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail ?? "Failed to restore this version");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Version history">
      <p className="text-[13.5px] leading-[1.6] text-[var(--muted)]">
        Every upload to this document is kept — restore an earlier version at any time.
      </p>

      {error && (
        <div className="mt-4">
          <Banner>{error}</Banner>
        </div>
      )}

      <div className="mt-5 flex max-h-[360px] flex-col gap-2 overflow-y-auto">
        {loading ? (
          <p className="text-[13px] text-[var(--faint)]">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="text-[13px] text-[var(--faint)]">No versions found.</p>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--border)] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13.5px] font-semibold text-[var(--text)]">
                    {formatRelativeTime(version.uploaded_at)}
                  </span>
                  {version.is_current && (
                    <span className="rounded-[100px] bg-[var(--green-bg)] px-[8px] py-[2px] font-mono text-[10px] font-bold tracking-[.05em] text-[var(--green)] uppercase">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-[3px] flex items-center gap-2 text-[12px] text-[var(--faint)]">
                  <span>{formatBytes(version.size_bytes)}</span>
                  {version.status !== "ready" && (
                    <StatusBadge status={version.status} reason={version.failure_reason} />
                  )}
                </div>
              </div>
              {!version.is_current && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={version.status !== "ready" || busyId === version.id}
                  title={version.status !== "ready" ? "Only a successfully processed version can be restored" : undefined}
                  onClick={() => handleRestore(version)}
                >
                  {busyId === version.id ? "Restoring…" : "Restore"}
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
