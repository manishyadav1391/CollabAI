"use client";

import { useParams } from "next/navigation";
import { useWorkspaceProjects } from "@/lib/hooks/useWorkspaceProjects";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ProjectsGrid } from "@/components/dashboard/ProjectsGrid";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";

export default function DashboardPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { members, projects, recentDocuments, loading } = useWorkspaceProjects(workspaceId);

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
