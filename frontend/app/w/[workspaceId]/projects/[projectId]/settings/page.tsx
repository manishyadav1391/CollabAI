"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [userIdsInput, setUserIdsInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const userIds = userIdsInput.split(",").map((s) => s.trim()).filter(Boolean);
    await apiClient.put(`/projects/${projectId}/permissions`, { user_ids: userIds });
    setStatus("Permissions updated.");
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Project Permissions
      </h1>
      <p className="mb-4 text-sm text-zinc-500">
        Paste comma-separated user IDs who should have access to this
        restricted project. (This project must have visibility set to
        &quot;restricted&quot; for this to take effect — that&apos;s set
        when the project is created.)
      </p>

      <form onSubmit={handleSave}>
        <textarea
          value={userIdsInput}
          onChange={(e) => setUserIdsInput(e.target.value)}
          placeholder="user-id-1, user-id-2"
          className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          rows={3}
        />
        <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
          Save
        </button>
        {status && <p className="mt-3 text-sm text-green-600">{status}</p>}
      </form>
    </div>
  );
}