"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderIcon, SettingsIcon } from "@/components/dashboard/icons";
import { MessageIcon, SparkleIcon } from "@/components/ui/icons";

export function ProjectSubNav({ workspaceId, projectId }: { workspaceId: string; projectId: string }) {
  const pathname = usePathname();
  const base = `/w/${workspaceId}/projects/${projectId}`;

  const tabs = [
    { href: `${base}/documents`, label: "Documents", icon: FolderIcon },
    { href: `${base}/chat`, label: "Team chat", icon: MessageIcon },
    { href: `${base}/ai`, label: "Ask AI", icon: SparkleIcon },
    { href: `${base}/settings`, label: "Settings", icon: SettingsIcon },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-6 lg:px-10">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex shrink-0 items-center gap-[7px] border-b-2 px-4 py-[10px] text-[13.5px] font-semibold whitespace-nowrap transition-colors"
            style={{
              borderColor: active ? "var(--accent)" : "transparent",
              color: active ? "var(--text)" : "var(--muted)",
            }}
          >
            <Icon size={14} stroke={active ? "var(--accent-soft)" : "var(--faint)"} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
