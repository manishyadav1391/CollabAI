"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import type { Member, Workspace } from "@/lib/types";
import { avatarGradient, formatRelativeTime, initials } from "@/lib/format";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Switch } from "@/components/ui/Switch";

const TABS = ["Workspace", "Members", "Notifications", "Danger zone"] as const;
type Tab = (typeof TABS)[number];

const panelClass = "rounded-[18px] border border-[var(--border)] bg-white p-[26px] shadow-[var(--sh-1)]";

function RoleChip({ role }: { role: string }) {
  const elevated = role === "admin" || role === "owner";
  return (
    <span
      className="rounded-[100px] px-[9px] py-[3px] font-mono text-[10px] font-bold tracking-[.05em] uppercase"
      style={{
        background: elevated ? "rgba(124,108,255,.16)" : "var(--bg-2)",
        color: elevated ? "var(--accent-soft)" : "var(--muted)",
      }}
    >
      {role}
    </span>
  );
}

function WorkspacePanel({ workspace }: { workspace: Workspace | null }) {
  return (
    <div className={panelClass}>
      <h3 className="text-[16px] font-bold text-[var(--text)]">General</h3>
      <p className="mt-1 text-[13.5px] text-[var(--muted)]">
        Basic information about this workspace.
      </p>
      <div className="mt-6 flex flex-col gap-4 max-w-[420px]">
        <Field label="Workspace name">
          <Input value={workspace?.name ?? ""} readOnly disabled />
        </Field>
        <div className="text-[12.5px] text-[var(--faint)]">
          Created {workspace ? formatRelativeTime(workspace.created_at) : "—"}
        </div>
      </div>
      <p className="mt-6 text-[12.5px] text-[var(--faint)]">
        Renaming and workspace-level branding are coming soon.
      </p>
    </div>
  );
}

function MembersPanel({ workspaceId, members, onInvited }: { workspaceId: string; members: Member[]; onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSending(true);
    try {
      await apiClient.post(`/workspaces/${workspaceId}/invites`, { email, role });
      setSuccess(`Invite sent to ${email}.`);
      setEmail("");
      onInvited();
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail ?? "Failed to send invite");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={panelClass}>
        <h3 className="text-[16px] font-bold text-[var(--text)]">Invite teammates</h3>
        <p className="mt-1 text-[13.5px] text-[var(--muted)]">
          They&apos;ll get an email with a link to join this workspace.
        </p>
        <form onSubmit={handleInvite} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Email address">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
              />
            </Field>
          </div>
          <div className="w-full sm:w-[140px]">
            <Field label="Role">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-[var(--r)] border border-[var(--border)] bg-[var(--panel-2)] px-[14px] py-[11px] font-sans text-[14px] text-[var(--text)] outline-none focus:border-[var(--accent)] focus:bg-white"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>
          <Button type="submit" disabled={sending} className="sm:w-auto">
            {sending ? "Sending…" : "Send invite"}
          </Button>
        </form>
        {error && (
          <div className="mt-4">
            <Banner>{error}</Banner>
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-[12px] bg-[var(--green-bg)] px-4 py-3 text-[13.5px] text-[var(--green)]">
            {success}
          </div>
        )}
      </div>

      <div className={`${panelClass} p-0`}>
        <div className="border-b border-[var(--border)] px-[26px] py-4">
          <h3 className="text-[16px] font-bold text-[var(--text)]">
            {members.length} member{members.length === 1 ? "" : "s"}
          </h3>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center justify-between gap-3 px-[26px] py-[14px]">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: avatarGradient(m.user_id) }}
                >
                  {initials(m.name)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-[var(--text)]">{m.name}</div>
                  <div className="truncate text-[12.5px] text-[var(--faint)]">{m.email}</div>
                </div>
              </div>
              <RoleChip role={m.role} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const rows = [
    { label: "Document finishes processing", sub: "Get notified when an upload is indexed and ready.", on: true },
    { label: "Someone mentions you", sub: "Chat and comment threads where you're @mentioned.", on: true },
    { label: "New teammate joins", sub: "A heads-up when someone accepts a workspace invite.", on: false },
    { label: "Weekly workspace digest", sub: "A summary of activity across all your projects.", on: false },
  ];
  return (
    <div className={panelClass}>
      <h3 className="text-[16px] font-bold text-[var(--text)]">Email notifications</h3>
      <p className="mt-1 text-[13.5px] text-[var(--muted)]">
        Choose what CollabAI should email you about. Wiring these up is next on the roadmap.
      </p>
      <div className="mt-6 flex flex-col gap-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-6 border-t border-[var(--border)] py-4 first:border-t-0">
            <div>
              <div className="text-[14px] font-semibold text-[var(--text)]">{r.label}</div>
              <div className="mt-[3px] text-[12.5px] text-[var(--muted)]">{r.sub}</div>
            </div>
            <Switch defaultChecked={r.on} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DangerZonePanel() {
  return (
    <div className="rounded-[18px] border border-[rgba(251,113,133,.35)] bg-white p-[26px] shadow-[var(--sh-1)]">
      <h3 className="text-[16px] font-bold text-[var(--red)]">Delete this workspace</h3>
      <p className="mt-1 max-w-[520px] text-[13.5px] leading-[1.6] text-[var(--muted)]">
        Permanently deletes every project, document, and message in this workspace. This can&apos;t
        be undone. This action isn&apos;t wired up yet.
      </p>
      <Button variant="danger" className="mt-5" disabled>
        Delete workspace
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [tab, setTab] = useState<Tab>("Workspace");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  function loadMembers() {
    apiClient.get<Member[]>(`/workspaces/${workspaceId}/members`).then(({ data }) => setMembers(data));
  }

  useEffect(() => {
    apiClient.get<Workspace[]>("/workspaces").then(({ data }) => {
      setWorkspace(data.find((w) => w.id === workspaceId) ?? null);
    });
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-6 py-8 lg:px-10">
      <div>
        <h1 className="text-[24px] font-extrabold tracking-[-.02em] text-[var(--text)]">Settings</h1>
        <p className="mt-1 text-[14px] text-[var(--muted)]">
          Manage this workspace, its members, and how CollabAI notifies you.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="shrink-0 border-b-2 px-4 py-[10px] text-[13.5px] font-semibold whitespace-nowrap transition-colors"
            style={{
              borderColor: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "var(--text)" : "var(--muted)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-[720px]">
        {tab === "Workspace" && <WorkspacePanel workspace={workspace} />}
        {tab === "Members" && <MembersPanel workspaceId={workspaceId} members={members} onInvited={loadMembers} />}
        {tab === "Notifications" && <NotificationsPanel />}
        {tab === "Danger zone" && <DangerZonePanel />}
      </div>
    </div>
  );
}
