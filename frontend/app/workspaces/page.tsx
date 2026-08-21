"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { isLoggedIn } from "@/lib/auth";
import type { Workspace } from "@/lib/types";
import { HexagonIcon } from "@/components/ui/icons";
import { FolderPlusIcon } from "@/components/dashboard/icons";

function WorkspaceSkeleton() {
  return (
    <div className="h-[64px] animate-pulse rounded-[14px] bg-[var(--panel-3)]" />
  );
}

export default function WorkspaceSwitcherPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    apiClient
      .get<Workspace[]>("/workspaces")
      .then(({ data }) => {
        if (data.length === 1) {
          router.replace(`/w/${data[0].id}/dashboard`);
          return;
        }
        setWorkspaces(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-[var(--bg)] px-6 py-16">
      <Link href="/" className="mb-10 flex items-center gap-[10px] text-[var(--text)]">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[image:var(--grad)] shadow-[var(--sh-accent)]">
          <HexagonIcon size={16} stroke="#fff" />
        </span>
        <span className="text-[17px] font-extrabold tracking-[-.02em]">CollabAI</span>
      </Link>

      <div className="w-full max-w-[440px]">
        <h1 className="text-[22px] font-extrabold tracking-[-.02em] text-[var(--text)]">
          Your workspaces
        </h1>
        <p className="mt-1 text-[13.5px] text-[var(--muted)]">Pick a workspace to jump back in.</p>

        <div className="mt-7 flex flex-col gap-3">
          {loading ? (
            <>
              <WorkspaceSkeleton />
              <WorkspaceSkeleton />
            </>
          ) : workspaces.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-[18px] border border-dashed border-[var(--border-2)] bg-white px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[image:var(--grad)] shadow-[var(--sh-accent)]">
                <FolderPlusIcon size={20} stroke="#fff" />
              </span>
              <p className="text-[14px] text-[var(--muted)]">You don&apos;t have any workspaces yet.</p>
              <Link
                href="/workspaces/create"
                className="inline-flex items-center gap-[7px] rounded-[var(--r)] px-6 py-[13px] text-[15px] font-semibold text-white shadow-[var(--sh-accent)] transition-transform hover:-translate-y-0.5 bg-[image:var(--grad)]"
              >
                Create your first workspace
              </Link>
            </div>
          ) : (
            <>
              {workspaces.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/w/${ws.id}/dashboard`}
                  className="flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-white p-4 shadow-[var(--sh-1)] transition-[transform,box-shadow] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-[var(--sh-2)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--bg-2)] font-mono text-[12px] font-bold text-[var(--muted)]">
                    {ws.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate text-[14.5px] font-semibold text-[var(--text)]">{ws.name}</span>
                </Link>
              ))}
              <Link
                href="/workspaces/create"
                className="mt-1 text-center text-[13.5px] font-semibold text-[var(--accent-soft)]"
              >
                + Create another workspace
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
