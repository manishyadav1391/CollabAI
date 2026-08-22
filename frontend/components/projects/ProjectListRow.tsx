import Link from "next/link";
import type { Member } from "@/lib/types";
import type { ProjectSummary } from "@/components/dashboard/ProjectsGrid";
import { formatRelativeTime } from "@/lib/format";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { ProjectMenu } from "@/components/dashboard/ProjectMenu";
import { AccessIndicator } from "@/components/projects/AccessIndicator";

export function ProjectListRow({
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
    <Link
      href={`/w/${workspaceId}/projects/${project.id}/documents`}
      className="grid grid-cols-[1.6fr_1.1fr_1fr_0.7fr_0.9fr_40px] items-center gap-4 border-b border-[var(--border)] px-5 py-[14px] transition-colors last:border-b-0 hover:bg-[var(--panel-2)]"
      style={{ animation: `om-rise .4s cubic-bezier(.2,.7,.2,1) ${Math.min(index * 35, 300)}ms both` }}
    >
      <span className="truncate text-[13.5px] font-semibold text-[var(--text)]">{project.name}</span>
      <AccessIndicator visibility={project.visibility} size="sm" />
      <AvatarStack members={members} max={4} size={22} />
      <span className="text-[13px] text-[var(--muted)]">{project.docCount}</span>
      <span className="text-[12.5px] text-[var(--faint)]">
        {project.lastActive ? formatRelativeTime(project.lastActive) : "—"}
      </span>
      <ProjectMenu
        workspaceId={workspaceId}
        projectId={project.id}
        isAdmin={isAdmin}
        onDeleteRequested={onDeleteRequested}
      />
    </Link>
  );
}
