"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontalIcon, SettingsIcon, UserPlusIcon } from "@/components/dashboard/icons";

export function ProjectMenu({
  workspaceId,
  projectId,
  isAdmin,
}: {
  workspaceId: string;
  projectId: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[var(--faint)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--muted)]"
        aria-label="Project options"
      >
        <MoreHorizontalIcon size={15} />
      </button>

      {open && (
        <div
          onClick={(e) => e.preventDefault()}
          className="absolute right-0 z-20 mt-1 w-[196px] overflow-hidden rounded-[12px] border border-[var(--border)] bg-white py-[6px] shadow-[var(--sh-2)]"
        >
          <Link
            href={`/w/${workspaceId}/projects/${projectId}/settings`}
            className="flex items-center gap-[9px] px-4 py-[9px] text-[13px] text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
          >
            <SettingsIcon size={14} />
            Edit settings
          </Link>
          <Link
            href={`/w/${workspaceId}/projects/${projectId}/settings`}
            className="flex items-center gap-[9px] px-4 py-[9px] text-[13px] text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
          >
            <UserPlusIcon size={14} />
            Manage members
          </Link>
          {isAdmin && (
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex w-full cursor-not-allowed items-center gap-[9px] px-4 py-[9px] text-left text-[13px] text-[var(--red)] opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
              </svg>
              Delete project
            </button>
          )}
        </div>
      )}
    </div>
  );
}
