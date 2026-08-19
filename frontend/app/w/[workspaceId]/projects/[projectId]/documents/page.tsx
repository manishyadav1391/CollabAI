"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/StatusBadge";

type DocumentItem = {
  id: string;
  current_version: { filename: string; status: string } | null;
};

export default function DocumentsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentsRef = useRef<DocumentItem[]>([]);

  function load() {
    apiClient
      .get("/documents", { params: { project_id: projectId } })
      .then(({ data }) => setDocuments(data));
  }

  useEffect(load, [projectId]);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  // Documents finish processing asynchronously on a background worker, so
  // poll while any are still pending/processing to pick up status changes
  // (e.g. processing -> ready) without requiring a manual page refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      const stillActive = documentsRef.current.some(
        (doc) => !doc.current_version || ["pending", "processing"].includes(doc.current_version.status)
      );
      if (stillActive) load();
    }, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const { data: session } = await apiClient.post("/documents/upload-url", {
        project_id: projectId,
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });

      // Direct-to-storage upload — bypasses our API server entirely.
      await axios.put(session.upload_url, file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      await apiClient.post("/documents/upload-complete", {
        document_id: session.document_id,
        version_id: session.version_id,
      });

      load();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Documents</h1>
        <label className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
          {uploading ? "Uploading…" : "+ Upload"}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        {documents.length === 0 && (
          <p className="text-sm text-zinc-500">No documents yet — upload your first file.</p>
        )}
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <span className="text-zinc-900 dark:text-zinc-50">
              {doc.current_version?.filename ?? "(processing…)"}
            </span>
            {doc.current_version && (
              <StatusBadge status={doc.current_version.status as any} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}