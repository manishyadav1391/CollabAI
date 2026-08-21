"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { Document, Member, Project } from "@/lib/types";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ProjectsGrid, type ProjectSummary } from "@/components/dashboard/ProjectsGrid";
import { RecentDocuments, type RecentDocument } from "@/components/dashboard/RecentDocuments";

const RECENT_DOCUMENT_LIMIT = 8;

export default function DashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [{ data: membersData }, { data: projectsData }] = await Promise.all([
        apiClient.get<Member[]>(`/workspaces/${workspaceId}/members`),
        apiClient.get<Project[]>(`/workspaces/${workspaceId}/projects`),
      ]);

      const perProjectDocuments = await Promise.all(
        projectsData.map((project) =>
          apiClient
            .get<Document[]>("/documents", { params: { project_id: project.id } })
            .then(({ data }) => ({ project, documents: data }))
            .catch(() => ({ project, documents: [] as Document[] })),
        ),
      );

      if (cancelled) return;

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
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-10 px-6 py-8 lg:px-10">
      <QuickActions workspaceId={workspaceId} />

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[19px] font-bold tracking-[-.01em] text-[var(--text)]">Active projects</h2>
          <span className="text-[13px] text-[var(--faint)]">
            {loading ? "" : `${projects.length} total`}
          </span>
        </div>
        <ProjectsGrid projects={projects} members={members} workspaceId={workspaceId} loading={loading} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[19px] font-bold tracking-[-.01em] text-[var(--text)]">Recent documents</h2>
        <RecentDocuments documents={recentDocuments} workspaceId={workspaceId} loading={loading} />
      </section>
    </div>
  );
}
