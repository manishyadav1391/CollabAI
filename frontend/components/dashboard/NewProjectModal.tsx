"use client";

import { useState } from "react";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import type { Project } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { GlobeIcon, LockIcon } from "@/components/dashboard/icons";

type Visibility = "workspace_wide" | "restricted";

export function NewProjectModal({
  workspaceId,
  open,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("workspace_wide");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function reset() {
    setName("");
    setDescription("");
    setVisibility("workspace_wide");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const { data } = await apiClient.post<Project>(`/workspaces/${workspaceId}/projects`, {
        name,
        visibility,
      });
      onCreated(data);
      reset();
      onClose();
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail ?? "Failed to create project");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="New project"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Project name">
          <Input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Q1 Renewals"
          />
        </Field>

        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project for?"
            rows={2}
            className="w-full resize-none rounded-[var(--r)] border border-[var(--border)] bg-[var(--panel-2)] px-[14px] py-[11px] font-sans text-[14px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--faint)] focus:border-[var(--accent)] focus:bg-white"
          />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="text-[13.5px] font-semibold text-[var(--text)]">Access</span>
          <button
            type="button"
            onClick={() => setVisibility("workspace_wide")}
            className="flex items-start gap-3 rounded-[12px] border p-[14px] text-left transition-colors"
            style={{
              borderColor: visibility === "workspace_wide" ? "var(--accent)" : "var(--border)",
              background: visibility === "workspace_wide" ? "rgba(124,108,255,.06)" : "var(--panel-2)",
            }}
          >
            <span className="mt-[1px] flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--green-bg)] text-[var(--green)]">
              <GlobeIcon size={15} />
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-[var(--text)]">Open to workspace</span>
              <span className="block text-[12px] text-[var(--muted)]">
                Anyone in this workspace can view and join.
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setVisibility("restricted")}
            className="flex items-start gap-3 rounded-[12px] border p-[14px] text-left transition-colors"
            style={{
              borderColor: visibility === "restricted" ? "var(--accent)" : "var(--border)",
              background: visibility === "restricted" ? "rgba(124,108,255,.06)" : "var(--panel-2)",
            }}
          >
            <span className="mt-[1px] flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--red-bg)] text-[var(--red)]">
              <LockIcon size={15} />
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold text-[var(--text)]">Restricted</span>
              <span className="block text-[12px] text-[var(--muted)]">
                Only specific invited members can view this.
              </span>
            </span>
          </button>
        </div>

        {error && <Banner>{error}</Banner>}

        <div className="mt-1 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
