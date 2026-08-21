"use client";

import { usePathname } from "next/navigation";
import { SearchIcon } from "@/components/dashboard/icons";
import { UserMenu } from "@/components/dashboard/UserMenu";

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Home",
  projects: "Projects",
  settings: "Settings",
};

export const TOPBAR_HEIGHT = 64;

export function Topbar({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean)[2];
  const section = SECTION_LABELS[segment] ?? "Home";

  return (
    <header
      className="sticky top-0 z-10 flex h-[64px] shrink-0 items-center gap-4 border-b border-[var(--border)] bg-[rgba(250,250,251,.85)] px-6 backdrop-blur-[10px]"
    >
      <div className="min-w-0 shrink-0 text-[13.5px] text-[var(--muted)]">
        <span className="font-semibold text-[var(--text)]">{workspaceName || "Workspace"}</span>
        <span className="mx-[6px] text-[var(--faint)]">/</span>
        {section}
      </div>

      <button
        type="button"
        className="mx-auto flex w-full max-w-[420px] items-center gap-[10px] rounded-[100px] border border-[var(--border)] bg-[var(--panel-2)] px-4 py-[9px] text-left text-[13.5px] text-[var(--faint)] transition-colors hover:border-[var(--border-2)] hover:bg-white"
      >
        <SearchIcon size={15} stroke="var(--faint)" />
        <span className="flex-1 truncate">Search documents, chats, or projects…</span>
        <span className="rounded-[6px] border border-[var(--border-2)] bg-white px-[6px] py-[2px] font-mono text-[10px] font-bold text-[var(--faint)]">
          Ctrl K
        </span>
      </button>

      <div className="shrink-0">
        <UserMenu workspaceId={workspaceId} />
      </div>
    </header>
  );
}
