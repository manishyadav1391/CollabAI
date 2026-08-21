import Link from "next/link";
import type { Member, Project } from "@/lib/types";
import { avatarGradient, formatRelativeTime, initials } from "@/lib/format";
import { FolderPlusIcon, MoreHorizontalIcon } from "@/components/dashboard/icons";

export type ProjectSummary = Project & { docCount: number; lastActive: string | null };

function VisibilityChip({ visibility }: { visibility: string }) {
  const restricted = visibility !== "workspace_wide";
  return (
    <span
      className="rounded-[100px] px-[9px] py-[3px] font-mono text-[10px] font-bold tracking-[.05em] whitespace-nowrap"
      style={{
        background: restricted ? "var(--red-bg)" : "var(--green-bg)",
        color: restricted ? "var(--red)" : "var(--green)",
      }}
    >
      {restricted ? "RESTRICTED" : "WORKSPACE-WIDE"}
    </span>
  );
}

function AvatarStack({ members }: { members: Member[] }) {
  if (members.length === 0) return null;
  return (
    <div className="flex">
      {members.slice(0, 3).map((m, i) => (
        <span
          key={m.user_id}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white"
          style={{ background: avatarGradient(m.user_id), marginLeft: i === 0 ? 0 : -8 }}
          title={m.name}
        >
          {initials(m.name)}
        </span>
      ))}
      {members.length > 3 && (
        <span
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-white bg-[var(--panel-3)] text-[9.5px] font-bold text-[var(--muted)]"
          style={{ marginLeft: -8 }}
        >
          +{members.length - 3}
        </span>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  members,
  workspaceId,
}: {
  project: ProjectSummary;
  members: Member[];
  workspaceId: string;
}) {
  return (
    <Link
      href={`/w/${workspaceId}/projects/${project.id}/documents`}
      className="flex flex-col gap-4 rounded-[18px] border border-[var(--border)] bg-white p-[22px] shadow-[var(--sh-1)] transition-[transform,box-shadow,border-color] duration-[.35s] ease-[var(--ease-out)] hover:-translate-y-[5px] hover:border-[var(--border-2)] hover:shadow-[var(--sh-2)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[16px] font-bold tracking-[-.01em] text-[var(--text)]">{project.name}</h3>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-[var(--faint)] hover:bg-[var(--panel-2)] hover:text-[var(--muted)]">
          <MoreHorizontalIcon size={15} />
        </span>
      </div>

      <div className="flex items-center gap-[10px] text-[13px] text-[var(--muted)]">
        <span>
          {project.docCount} document{project.docCount === 1 ? "" : "s"}
        </span>
        <span className="text-[var(--faint)]">·</span>
        <VisibilityChip visibility={project.visibility} />
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <AvatarStack members={members} />
        <span className="text-[12px] text-[var(--faint)]">
          {project.lastActive ? `Active ${formatRelativeTime(project.lastActive)}` : "No activity yet"}
        </span>
      </div>
    </Link>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-[var(--border)] bg-white p-[22px] shadow-[var(--sh-1)]">
      <div className="h-[18px] w-2/3 animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="h-[14px] w-1/2 animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      <div className="mt-auto flex items-center justify-between pt-1">
        <div className="h-[26px] w-[64px] animate-pulse rounded-full bg-[var(--panel-3)]" />
        <div className="h-[12px] w-[70px] animate-pulse rounded-[6px] bg-[var(--panel-3)]" />
      </div>
    </div>
  );
}

function EmptyWorkspaceState({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-[20px] border border-dashed border-[var(--border-2)] bg-white px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[image:var(--grad)] shadow-[var(--sh-accent)]">
        <FolderPlusIcon size={24} stroke="#fff" />
      </span>
      <div>
        <h3 className="text-[19px] font-bold tracking-[-.02em] text-[var(--text)]">
          Welcome to your new workspace
        </h3>
        <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-[1.6] text-[var(--muted)]">
          Let&apos;s get your first project set up — you can upload documents and start asking
          questions the moment it&apos;s created.
        </p>
      </div>
      <Link
        href={`/w/${workspaceId}/projects`}
        className="inline-flex items-center gap-[7px] rounded-[var(--r)] px-6 py-[13px] text-[15px] font-semibold text-white shadow-[var(--sh-accent)] transition-transform hover:-translate-y-0.5 bg-[image:var(--grad)]"
      >
        Create your first project
      </Link>
    </div>
  );
}

export function ProjectsGrid({
  projects,
  members,
  workspaceId,
  loading,
}: {
  projects: ProjectSummary[];
  members: Member[];
  workspaceId: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    );
  }

  if (projects.length === 0) {
    return <EmptyWorkspaceState workspaceId={workspaceId} />;
  }

  return (
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} members={members} workspaceId={workspaceId} />
      ))}
    </div>
  );
}
