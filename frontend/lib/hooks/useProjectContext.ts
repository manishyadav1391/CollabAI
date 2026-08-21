"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { Member, Project, Workspace } from "@/lib/types";

/** Workspace + project name and the member roster, for breadcrumbs and
 * resolving "uploaded by" / comment author ids to real names. */
export function useProjectContext(workspaceId: string, projectId: string) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    apiClient
      .get<Workspace[]>("/workspaces")
      .then(({ data }) => {
        const ws = data.find((w) => w.id === workspaceId);
        if (ws) setWorkspaceName(ws.name);
      })
      .catch(() => {});

    apiClient
      .get<Project[]>(`/workspaces/${workspaceId}/projects`)
      .then(({ data }) => {
        setProject(data.find((p) => p.id === projectId) ?? null);
      })
      .catch(() => {});

    apiClient
      .get<Member[]>(`/workspaces/${workspaceId}/members`)
      .then(({ data }) => setMembers(data))
      .catch(() => {});
  }, [workspaceId, projectId]);

  function memberName(userId: string, currentUserId: string | null) {
    if (userId === currentUserId) return "You";
    return members.find((m) => m.user_id === userId)?.name ?? "Unknown";
  }

  return { workspaceName, project, members, memberName };
}
