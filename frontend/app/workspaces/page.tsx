"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { isLoggedIn } from "@/lib/auth";

type Workspace = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
};

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
      .get("/workspaces")
      .then(({ data }) => setWorkspaces(data))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="p-10 text-center text-zinc-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Your Workspaces
      </h1>

      {workspaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="mb-4 text-zinc-500">You don&apos;t have any workspaces yet.</p>
          
            <a href="/workspaces/create"
            className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
          
            Create your first workspace
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{ws.name}</p>
            </div>
          ))}
          
           <a  href="/workspaces/create"
            className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400" >
          
            + Create another workspace
          </a>
        </div>
      )}
    </div>
  );
}