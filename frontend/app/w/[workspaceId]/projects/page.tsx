"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { Project } from "@/lib/types";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FolderIcon } from "@/components/dashboard/icons";

export default function ProjectsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  function load() {
    apiClient
      .get<Project[]>(`/workspaces/${workspaceId}/projects`)
      .then(({ data }) => setProjects(data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [workspaceId]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.post(`/workspaces/${workspaceId}/projects`, {
        name,
        visibility: "workspace_wide",
      });
      setName("");
      load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-8 px-6 py-8 lg:px-10">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-[-.02em] text-[var(--text)]">Projects</h1>
        <p className="mt-1 text-[14px] text-[var(--muted)]">
          Every project in this workspace, and a quick way to start a new one.
        </p>
      </div>

      <form
        onSubmit={createProject}
        className="flex flex-col gap-3 rounded-[16px] border border-[var(--border)] bg-white p-5 shadow-[var(--sh-1)] sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Field label="New project name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Q1 Renewals" />
          </Field>
        </div>
        <Button type="submit" disabled={creating} className="sm:w-auto">
          {creating ? "Creating…" : "Create project"}
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        {loading ? (
          <>
            <div className="h-[60px] animate-pulse rounded-[14px] bg-[var(--panel-3)]" />
            <div className="h-[60px] animate-pulse rounded-[14px] bg-[var(--panel-3)]" />
          </>
        ) : projects.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-[var(--border-2)] bg-white p-8 text-center text-[14px] text-[var(--muted)]">
            No projects yet — create your first one above.
          </p>
        ) : (
          projects.map((p) => (
            <a
              key={p.id}
              href={`/w/${workspaceId}/projects/${p.id}/documents`}
              className="flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-white p-4 shadow-[var(--sh-1)] transition-[transform,box-shadow] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-[var(--sh-2)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--bg-2)] text-[var(--muted)]">
                <FolderIcon size={16} />
              </span>
              <span className="truncate text-[14.5px] font-semibold text-[var(--text)]">{p.name}</span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
