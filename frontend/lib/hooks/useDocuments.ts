"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { getCurrentUserId } from "@/lib/auth";
import type { Document } from "@/lib/types";

const ACTIVE_STATUSES = ["pending", "processing"];
const POLL_INTERVAL_MS = 3000;

export function useDocuments(projectId: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const documentsRef = useRef<Document[]>([]);

  const load = useCallback(() => {
    return apiClient
      .get<Document[]>("/documents", { params: { project_id: projectId } })
      .then(({ data }) => setDocuments(data))
      .catch(() => {})
      .then(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  // Documents finish processing asynchronously on a background worker —
  // poll while any are still queued/processing so status changes (and the
  // moment a document disappears into "ready") show up without a refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      const stillActive = documentsRef.current.some(
        (doc) => !doc.current_version || ACTIVE_STATUSES.includes(doc.current_version.status),
      );
      if (stillActive) load();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  function uploadOne(file: File) {
    apiClient
      .post("/documents/upload-url", {
        project_id: projectId,
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      })
      .then(({ data: session }) => {
        const optimistic: Document = {
          id: session.document_id,
          project_id: projectId,
          folder_id: null,
          restricted: false,
          created_by: getCurrentUserId() ?? "",
          current_version: {
            filename: file.name,
            mime_type: file.type || "application/octet-stream",
            size_bytes: file.size,
            status: "pending",
            failure_reason: null,
            uploaded_at: new Date().toISOString(),
          },
        };
        setDocuments((prev) => [optimistic, ...prev]);

        return axios
          .put(session.upload_url, file, {
            headers: { "Content-Type": file.type || "application/octet-stream" },
          })
          .then(() =>
            apiClient.post("/documents/upload-complete", {
              document_id: session.document_id,
              version_id: session.version_id,
            }),
          )
          .then(() => {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === session.document_id && d.current_version
                  ? { ...d, current_version: { ...d.current_version, status: "processing" } }
                  : d,
              ),
            );
          })
          .catch(() => {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === session.document_id && d.current_version
                  ? {
                      ...d,
                      current_version: {
                        ...d.current_version,
                        status: "processing_failed",
                        failure_reason: "Upload failed",
                      },
                    }
                  : d,
              ),
            );
          });
      })
      .catch(() => {});
  }

  function uploadFiles(files: FileList | File[]) {
    Array.from(files).forEach(uploadOne);
  }

  function deleteDocument(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    return apiClient.delete(`/documents/${id}`).catch(() => load());
  }

  return { documents, loading, uploadFiles, deleteDocument, reload: load };
}
