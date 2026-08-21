"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceProjects } from "@/lib/hooks/useWorkspaceProjects";
import { getCurrentUserId } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { SearchIcon, PlusIcon } from "@/components/dashboard/icons";
import { NewProjectModal } from "@/components/dashboard/NewProjectModal";
import { ProjectGridCard } from "@/components/projects/ProjectGridCard";
import { ProjectListRow } from "@/components/projects/ProjectListRow";
import { ProjectsEmptyState } from "@/components/projects/ProjectsEmptyState";
import { ProjectsSkeleton } from "@/components/projects/ProjectsSkeleton";
import { ViewToggle, type ViewMode } from "@/components/projects/ViewToggle";

const LIST_HEADER_COLS = ["Name", "Access level", "Members", "Documents", "Last active", ""];

export default function ProjectsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { members, projects, loading, addProject } = useWorkspaceProjects(workspaceId);

  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const currentUserId = getCurrentUserId();
  const isAdmin = useMemo(() => {
    const me = members.find((m) => m.user_id === currentUserId);
    return me ? me.role === "admin" || me.role === "owner" : false;
  }, [members, currentUserId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-6 py-8 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-extrabold tracking-[-.02em] text-[var(--text)]">Projects</h1>
          <span className="rounded-[100px] bg-[var(--bg-2)] px-[10px] py-[3px] font-mono text-[12px] font-bold text-[var(--muted)]">
            {loading ? "—" : projects.length}
          </span>
        </div>

        {isAdmin ? (
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon size={15} />
            New project
          </Button>
        ) : (
          <span title="Only workspace admins can create projects">
            <Button disabled>
              <PlusIcon size={15} />
              New project
            </Button>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-[320px]">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--faint)]">
            <SearchIcon size={15} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="w-full rounded-[10px] border border-[var(--border)] bg-white py-[9px] pr-3 pl-9 text-[13.5px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--faint)] focus:border-[var(--accent)]"
          />
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {loading ? (
        <ProjectsSkeleton view={view} />
      ) : projects.length === 0 ? (
        <ProjectsEmptyState onCreate={() => setModalOpen(true)} />
      ) : filtered.length === 0 ? (
        <p className="rounded-[16px] border border-dashed border-[var(--border-2)] bg-white px-6 py-16 text-center text-[13.5px] text-[var(--muted)]">
          No projects match &quot;{query}&quot;.
        </p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, index) => (
            <ProjectGridCard
              key={project.id}
              project={project}
              members={members}
              workspaceId={workspaceId}
              isAdmin={isAdmin}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
          <div className="hidden grid-cols-[1.6fr_1.1fr_1fr_0.7fr_0.9fr_40px] gap-4 border-b border-[var(--border)] bg-[var(--panel-2)] px-5 py-[10px] font-mono text-[10.5px] font-bold tracking-[.05em] text-[var(--faint)] uppercase sm:grid">
            {LIST_HEADER_COLS.map((col) => (
              <span key={col}>{col}</span>
            ))}
          </div>
          {filtered.map((project, index) => (
            <ProjectListRow
              key={project.id}
              project={project}
              members={members}
              workspaceId={workspaceId}
              isAdmin={isAdmin}
              index={index}
            />
          ))}
        </div>
      )}

      <NewProjectModal
        workspaceId={workspaceId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(project) => {
          addProject(project);
          setToast("Project created!");
        }}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
