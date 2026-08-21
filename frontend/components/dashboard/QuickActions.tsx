import Link from "next/link";
import { IconTile } from "@/components/ui/IconTile";
import { FolderPlusIcon, UploadCloudIcon, UserPlusIcon } from "@/components/dashboard/icons";

export function QuickActions({ workspaceId }: { workspaceId: string }) {
  const actions = [
    {
      href: `/w/${workspaceId}/projects`,
      title: "Create new project",
      body: "Spin up a space for a new deal, team, or initiative.",
      icon: FolderPlusIcon,
    },
    {
      href: `/w/${workspaceId}/projects`,
      title: "Upload document",
      body: "Drop a PDF or DOCX in — indexing starts automatically.",
      icon: UploadCloudIcon,
    },
    {
      href: `/w/${workspaceId}/settings`,
      title: "Invite teammates",
      body: "Bring your team into the workspace to chat and review.",
      icon: UserPlusIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {actions.map((a) => (
        <Link
          key={a.title}
          href={a.href}
          className="flex items-start gap-[14px] rounded-[16px] border border-[var(--border)] bg-white p-5 shadow-[var(--sh-1)] transition-transform duration-200 ease-[var(--ease-out)] hover:-translate-y-[3px] hover:shadow-[var(--sh-2)]"
        >
          <IconTile size="md">
            <a.icon size={16} stroke="#fff" />
          </IconTile>
          <div className="min-w-0">
            <div className="text-[14.5px] font-bold text-[var(--text)]">{a.title}</div>
            <div className="mt-[3px] text-[12.5px] leading-[1.5] text-[var(--muted)]">{a.body}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
