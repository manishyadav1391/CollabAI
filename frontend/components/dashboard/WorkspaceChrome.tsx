"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { isLoggedIn } from "@/lib/auth";
import type { Workspace } from "@/lib/types";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export function WorkspaceChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspaceName, setWorkspaceName] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    apiClient.get("/workspaces").then(({ data }: { data: Workspace[] }) => {
      const current = data.find((w) => w.id === workspaceId);
      if (current) setWorkspaceName(current.name);
    });
  }, [workspaceId, router]);

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar workspaceId={workspaceId} workspaceName={workspaceName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar workspaceId={workspaceId} workspaceName={workspaceName} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
