"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";

type Project = { id: string; name: string; visibility: string };

export default function ProjectsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    apiClient
      .get(`/workspaces/${workspaceId}/projects`)
      .then(({ data }) => setProjects(data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [workspaceId]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    await apiClient.post(`/workspaces/${workspaceId}/projects`, {
      name,
      visibility: "workspace_wide",
    });
    setName("");
    load();
  }

  if (loading) return <div className="p-10 text-center text-zinc-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Projects</h1>

      <form onSubmit={createProject} className="mb-6 flex gap-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
          Create
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {projects.map((p) => (
          
           <a key={p.id}
            href={`/w/${workspaceId}/projects/${p.id}/documents`}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            {p.name}
          </a>
        ))}
      </div>
    </div>
  );
}