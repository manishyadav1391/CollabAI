"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HexagonIcon } from "@/components/ui/icons";
import { ChevronDownIcon, FolderIcon, HomeIcon, SettingsIcon } from "@/components/dashboard/icons";

export function Sidebar({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const pathname = usePathname();
  const base = `/w/${workspaceId}`;

  const items = [
    { href: `${base}/dashboard`, label: "Home", icon: HomeIcon },
    { href: `${base}/projects`, label: "Projects", icon: FolderIcon },
    { href: `${base}/settings`, label: "Settings", icon: SettingsIcon },
  ];

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col gap-6 border-r border-[var(--border)] bg-[var(--panel-2)] px-4 py-5 lg:flex">
      <Link href="/" className="flex items-center gap-[10px] px-2 text-[var(--text)]">
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded-[9px] bg-[image:var(--grad)] shadow-[var(--sh-accent)]">
          <HexagonIcon size={15} stroke="#fff" />
        </span>
        <span className="text-[15px] font-extrabold tracking-[-.02em]">CollabAI</span>
      </Link>

      <Link
        href="/workspaces"
        className="flex items-center justify-between gap-2 rounded-[12px] border border-[var(--border)] bg-white px-3 py-[10px] shadow-[var(--sh-1)] transition-colors hover:border-[var(--border-2)]"
      >
        <div className="flex min-w-0 items-center gap-[9px]">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-[var(--bg-2)] font-mono text-[10px] font-bold text-[var(--muted)]">
            {workspaceName ? workspaceName.slice(0, 1).toUpperCase() : "…"}
          </span>
          <span className="truncate text-[13px] font-semibold text-[var(--text)]">
            {workspaceName || "Loading…"}
          </span>
        </div>
        <ChevronDownIcon size={13} stroke="var(--faint)" />
      </Link>

      <nav className="flex flex-col gap-[3px]">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-[10px] rounded-[10px] px-3 py-[9px] text-[13.5px] font-medium transition-colors"
              style={{
                color: active ? "var(--text)" : "var(--muted)",
                background: active ? "#fff" : "transparent",
                border: `1px solid ${active ? "var(--border)" : "transparent"}`,
                boxShadow: active ? "var(--sh-1)" : "none",
              }}
            >
              <Icon size={16} stroke={active ? "var(--accent-soft)" : "var(--faint)"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
