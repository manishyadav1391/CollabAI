"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { Document, Member, Project } from "@/lib/types";
import type { ProjectSummary } from "@/components/dashboard/ProjectsGrid";
import type { RecentDocument } from "@/components/dashboard/RecentDocuments";

const RECENT_DOCUMENT_LIMIT = 8;

/** Shared by the dashboard and the projects directory — both need the same
 * workspace members + per-project document rollups. */
export function useWorkspaceProjects(workspaceId: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return Promise.all([
      apiClient.get<Member[]>(`/workspaces/${workspaceId}/members`),
      apiClient.get<Project[]>(`/workspaces/${workspaceId}/projects`),
    ]).then(([{ data: membersData }, { data: projectsData }]) =>
      Promise.all(
        projectsData.map((project) =>
          apiClient
            .get<Document[]>("/documents", { params: { project_id: project.id } })
            .then(({ data }) => ({ project, documents: data }))
            .catch(() => ({ project, documents: [] as Document[] })),
        ),
      ).then((perProjectDocuments) => {
        const summaries: ProjectSummary[] = perProjectDocuments.map(({ project, documents }) => {
          const timestamps = documents
            .map((d) => d.current_version?.uploaded_at)
            .filter((t): t is string => Boolean(t));
          const lastActive = timestamps.length
            ? timestamps.reduce((latest, t) => (t > latest ? t : latest))
            : null;
          return { ...project, docCount: documents.length, lastActive };
        });

        const allDocuments: RecentDocument[] = perProjectDocuments
          .flatMap(({ project, documents }) =>
            documents
              .filter((d) => d.current_version)
              .map((d) => ({
                id: d.id,
                filename: d.current_version!.filename,
                projectId: project.id,
                projectName: project.name,
                status: d.current_version!.status,
                uploadedAt: d.current_version!.uploaded_at,
              })),
          )
          .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
          .slice(0, RECENT_DOCUMENT_LIMIT);

        setMembers(membersData);
        setProjects(summaries);
        setRecentDocuments(allDocuments);
        setLoading(false);
      }),
    ).catch(() => {
      setLoading(false);
    });
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  function addProject(project: Project) {
    setProjects((prev) => [{ ...project, docCount: 0, lastActive: null }, ...prev]);
  }

  function removeProject(projectId: string) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }

  return { members, projects, recentDocuments, loading, reload: load, addProject, removeProject };
}
