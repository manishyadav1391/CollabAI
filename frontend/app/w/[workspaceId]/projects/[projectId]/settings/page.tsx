"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useProjectContext } from "@/lib/hooks/useProjectContext";
import { ProjectPageHeader } from "@/components/projects/ProjectPageHeader";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function ProjectSettingsPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const { workspaceName, project } = useProjectContext(workspaceId, projectId);
  const [userIdsInput, setUserIdsInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const userIds = userIdsInput.split(",").map((s) => s.trim()).filter(Boolean);
      await apiClient.put(`/projects/${projectId}/permissions`, { user_ids: userIds });
      setStatus("Permissions updated.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col">
      <ProjectPageHeader
        workspaceId={workspaceId}
        projectId={projectId}
        workspaceName={workspaceName}
        projectName={project?.name ?? ""}
      />

      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-6 py-8 lg:px-10">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-.02em] text-[var(--text)]">Project settings</h1>
          <p className="mt-1 text-[14px] text-[var(--muted)]">Manage who can access this project.</p>
        </div>

        <form
          onSubmit={handleSave}
          className="flex flex-col gap-4 rounded-[16px] border border-[var(--border)] bg-white p-[26px] shadow-[var(--sh-1)]"
        >
          <h3 className="text-[15px] font-bold text-[var(--text)]">Restricted access</h3>
          <p className="text-[13px] leading-[1.6] text-[var(--muted)]">
            Paste comma-separated user IDs who should have access to this project. This only takes
            effect when the project&apos;s visibility is set to &quot;restricted&quot; — that&apos;s
            chosen when the project is created.
          </p>

          <Field label="Allowed user IDs">
            <textarea
              value={userIdsInput}
              onChange={(e) => setUserIdsInput(e.target.value)}
              placeholder="user-id-1, user-id-2"
              rows={3}
              className="w-full resize-none rounded-[var(--r)] border border-[var(--border)] bg-[var(--panel-2)] px-[14px] py-[11px] font-mono text-[13px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--faint)] focus:border-[var(--accent)] focus:bg-white"
            />
          </Field>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={saving} className="w-fit">
              {saving ? "Saving…" : "Save"}
            </Button>
            {status && <span className="text-[13px] font-semibold text-[var(--green)]">{status}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
