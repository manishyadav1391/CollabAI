"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearTokens } from "@/lib/auth";
import { LogOutIcon, SettingsIcon } from "@/components/dashboard/icons";

export function UserMenu({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white bg-[image:var(--grad)] transition-transform hover:-translate-y-0.5"
        aria-label="Account menu"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[210px] overflow-hidden rounded-[14px] border border-[var(--border)] bg-white py-[6px] shadow-[var(--sh-2)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="text-[13px] font-semibold text-[var(--text)]">Your account</div>
            <div className="mt-[2px] text-[12px] text-[var(--faint)]">Signed in</div>
          </div>
          <Link
            href={`/w/${workspaceId}/settings`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-[10px] px-4 py-[10px] text-[13.5px] text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
          >
            <SettingsIcon size={15} />
            Preferences
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-[10px] px-4 py-[10px] text-left text-[13.5px] text-[var(--red)] hover:bg-[var(--red-bg)]"
          >
            <LogOutIcon size={15} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
