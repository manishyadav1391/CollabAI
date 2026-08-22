"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { getCurrentUserId } from "@/lib/auth";
import type { Document } from "@/lib/types";

const ACTIVE_STATUSES = ["pending", "processing"];
const POLL_INTERVAL_MS = 3000;

// Files above this size use chunked/resumable upload (FR-DOC-05) instead of
// a single presigned PUT — splitting into parts survives a network blip
// without re-sending the whole file, and a page reload can resume by asking
// the server which parts already landed.
const MULTIPART_THRESHOLD_BYTES = 20 * 1024 * 1024;
const MAX_PART_RETRIES = 3;

type StoredUploadSession = {
  documentId: string;
  versionId: string;
  partSizeBytes: number;
  totalParts: number;
};

function uploadSessionKey(projectId: string, folderId: string | null, file: File, documentId: string | null) {
  return `collabai:upload:${projectId}:${folderId ?? "root"}:${documentId ?? "new"}:${file.name}:${file.size}:${file.lastModified}`;
}

function loadStoredSession(key: string): StoredUploadSession | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredSession(key: string, session: StoredUploadSession) {
  try {
    localStorage.setItem(key, JSON.stringify(session));
  } catch {
    // best-effort only — a lost session just means this file re-initiates
    // a fresh multipart upload instead of resuming one
  }
}

function clearStoredSession(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

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

  function upsertOptimistic(documentId: string, folderId: string | null, file: File) {
    const pendingVersion = {
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      status: "pending" as const,
      failure_reason: null,
      uploaded_at: new Date().toISOString(),
    };
    setDocuments((prev) => {
      // A re-upload (FR-DOC-07) targets a document already in the list —
      // reflect the new version's pending state on it rather than skipping.
      if (prev.some((d) => d.id === documentId)) {
        return prev.map((d) => (d.id === documentId ? { ...d, current_version: pendingVersion } : d));
      }
      const optimistic: Document = {
        id: documentId,
        project_id: projectId,
        folder_id: folderId,
        restricted: false,
        created_by: getCurrentUserId() ?? "",
        current_version: pendingVersion,
      };
      return [optimistic, ...prev];
    });
  }

  function setUploadProgress(documentId: string, percent: number | null) {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === documentId && d.current_version
          ? { ...d, current_version: { ...d.current_version, upload_progress: percent ?? undefined } }
          : d,
      ),
    );
  }

  function markStatus(documentId: string, status: "processing" | "processing_failed", failureReason?: string) {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === documentId && d.current_version
          ? {
              ...d,
              current_version: {
                ...d.current_version,
                status,
                failure_reason: failureReason ?? d.current_version.failure_reason,
                upload_progress: undefined,
              },
            }
          : d,
      ),
    );
  }

  async function uploadChunked(file: File, folderId: string | null, targetDocumentId: string | null = null) {
    const key = uploadSessionKey(projectId, folderId, file, targetDocumentId);
    let session = loadStoredSession(key);

    if (!session) {
      const { data } = await apiClient.post("/documents/multipart/initiate", {
        project_id: projectId,
        folder_id: folderId,
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        document_id: targetDocumentId,
      });
      session = {
        documentId: data.document_id,
        versionId: data.version_id,
        partSizeBytes: data.part_size_bytes,
        totalParts: data.total_parts,
      };
      saveStoredSession(key, session);
    }

    const { documentId, versionId, partSizeBytes, totalParts } = session;
    upsertOptimistic(documentId, folderId, file);

    let existingParts: { part_number: number; etag: string; size_bytes: number }[];
    try {
      const { data } = await apiClient.get(`/documents/multipart/${documentId}/${versionId}/parts`);
      existingParts = data;
    } catch {
      // The upload session is gone server-side (already completed or
      // aborted in an earlier run) — nothing left to resume.
      clearStoredSession(key);
      load();
      return;
    }

    const uploadedNumbers = new Set(existingParts.map((p) => p.part_number));
    let uploadedBytes = existingParts.reduce((sum, p) => sum + p.size_bytes, 0);
    setUploadProgress(documentId, Math.min(99, Math.round((uploadedBytes / file.size) * 100)));

    try {
      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        if (uploadedNumbers.has(partNumber)) continue;

        const start = (partNumber - 1) * partSizeBytes;
        const blob = file.slice(start, Math.min(start + partSizeBytes, file.size));

        let uploaded = false;
        let lastError: unknown;
        for (let attempt = 0; attempt < MAX_PART_RETRIES && !uploaded; attempt++) {
          try {
            const { data: partUrl } = await apiClient.post("/documents/multipart/part-url", {
              document_id: documentId,
              version_id: versionId,
              part_number: partNumber,
            });
            await axios.put(partUrl.url, blob);
            uploaded = true;
          } catch (err) {
            lastError = err;
          }
        }
        if (!uploaded) throw lastError ?? new Error(`Failed to upload part ${partNumber}`);

        uploadedBytes += blob.size;
        setUploadProgress(documentId, Math.min(99, Math.round((uploadedBytes / file.size) * 100)));
      }

      const { data: finalParts } = await apiClient.get(`/documents/multipart/${documentId}/${versionId}/parts`);
      const orderedParts = [...finalParts].sort((a, b) => a.part_number - b.part_number);

      await apiClient.post("/documents/multipart/complete", {
        document_id: documentId,
        version_id: versionId,
        parts: orderedParts.map((p) => ({ part_number: p.part_number, etag: p.etag })),
      });

      clearStoredSession(key);
      markStatus(documentId, "processing");
    } catch {
      // Keep the stored session — if this was a transient network blip,
      // re-uploading the same file will resume from the parts that already
      // landed instead of starting over.
      markStatus(documentId, "processing_failed", "Upload interrupted — try uploading this file again to resume");
    }
  }

  function uploadSingleShot(file: File, folderId: string | null, documentId: string | null = null) {
    return apiClient
      .post("/documents/upload-url", {
        project_id: projectId,
        folder_id: folderId,
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        document_id: documentId,
      })
      .then(({ data: session }) => {
        upsertOptimistic(session.document_id, folderId, file);

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
          .then(() => markStatus(session.document_id, "processing"))
          .catch(() => markStatus(session.document_id, "processing_failed", "Upload failed"));
      });
  }

  function uploadOne(file: File, folderId: string | null = null, documentId: string | null = null) {
    if (file.size > MULTIPART_THRESHOLD_BYTES) {
      uploadChunked(file, folderId, documentId).catch(() => {});
    } else {
      uploadSingleShot(file, folderId, documentId).catch(() => {});
    }
  }

  function uploadFiles(files: FileList | File[], folderId: string | null = null) {
    Array.from(files).forEach((file) => uploadOne(file, folderId));
  }

  /** Upload a new version onto an existing document (FR-DOC-07) instead of
   * creating a new one. */
  function reuploadFile(documentId: string, folderId: string | null, file: File) {
    uploadOne(file, folderId, documentId);
  }

  function deleteDocument(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    return apiClient.delete(`/documents/${id}`).catch(() => load());
  }

  return { documents, loading, uploadFiles, reuploadFile, deleteDocument, reload: load };
}
