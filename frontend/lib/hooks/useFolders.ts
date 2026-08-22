"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { Folder } from "@/lib/types";

export function useFolders(projectId: string) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return apiClient
      .get<Folder[]>("/folders", { params: { project_id: projectId } })
      .then(({ data }) => setFolders(data))
      .catch(() => {})
      .then(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  function createFolder(name: string, parentFolderId: string | null) {
    return apiClient
      .post<Folder>("/folders", { project_id: projectId, parent_folder_id: parentFolderId, name })
      .then(({ data }) => {
        setFolders((prev) => [...prev, data]);
        return data;
      });
  }

  function deleteFolder(folderId: string) {
    return apiClient.delete(`/folders/${folderId}`).then(() => {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
    });
  }

  return { folders, loading, createFolder, deleteFolder, reload: load };
}
