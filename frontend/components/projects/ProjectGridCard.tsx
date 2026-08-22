import Link from "next/link";
import type { Member } from "@/lib/types";
import type { ProjectSummary } from "@/components/dashboard/ProjectsGrid";
import { formatRelativeTime } from "@/lib/format";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { ProjectMenu } from "@/components/dashboard/ProjectMenu";
import { AccessIndicator } from "@/components/projects/AccessIndicator";

export function ProjectGridCard({
  project,
  members,
  workspaceId,
  isAdmin,
  index,
  onDeleteRequested,
}: {
  project: ProjectSummary;
  members: Member[];
  workspaceId: string;
  isAdmin: boolean;
  index: number;
  onDeleteRequested?: () => void;
}) {
  return (
    <div
      className="relative flex flex-col gap-4 rounded-[16px] border border-[var(--border)] bg-white p-[22px] transition-[transform,box-shadow,border-color] duration-[.3s] ease-[var(--ease-out)] hover:-translate-y-[3px] hover:border-[var(--border-2)] hover:shadow-[var(--sh-1)]"
      style={{ animation: `om-rise .5s cubic-bezier(.2,.7,.2,1) ${Math.min(index * 45, 360)}ms both` }}
    >
      <Link
        href={`/w/${workspaceId}/projects/${project.id}/documents`}
        className="absolute inset-0"
        aria-label={project.name}
      />

      <div className="pointer-events-none flex items-start justify-between gap-3">
        <h3 className="truncate text-[16px] font-bold tracking-[-.01em] text-[var(--text)]">{project.name}</h3>
        <div className="pointer-events-auto">
          <ProjectMenu
            workspaceId={workspaceId}
            projectId={project.id}
            isAdmin={isAdmin}
            onDeleteRequested={onDeleteRequested}
          />
        </div>
      </div>

      <div className="pointer-events-none flex items-center gap-[10px]">
        <AccessIndicator visibility={project.visibility} size="sm" />
        <span className="text-[var(--faint)]">·</span>
        <span className="text-[12px] text-[var(--muted)]">
          {project.docCount} document{project.docCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="pointer-events-none mt-auto flex items-center justify-between gap-3 pt-1">
        <AvatarStack members={members} max={4} />
        <span className="text-[12px] text-[var(--faint)]">
          {project.lastActive ? `Updated ${formatRelativeTime(project.lastActive)}` : "No activity yet"}
        </span>
      </div>
    </div>
  );
}
