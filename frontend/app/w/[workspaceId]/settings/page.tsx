"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { getCurrentUserId } from "@/lib/auth";
import type { Member, Workspace } from "@/lib/types";
import { avatarGradient, formatRelativeTime, initials } from "@/lib/format";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { Switch } from "@/components/ui/Switch";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";

const TABS = ["Workspace", "Members", "Notifications", "Account", "Danger zone"] as const;
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

function MembersPanel({
  workspaceId,
  members,
  onInvited,
  currentUserId,
  currentRole,
}: {
  workspaceId: string;
  members: Member[];
  onInvited: () => void;
  currentUserId: string | null;
  currentRole: string | null;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [transferTarget, setTransferTarget] = useState<Member | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const isAdmin = currentRole === "admin" || currentRole === "owner";
  const isOwner = currentRole === "owner";

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

  async function handleRoleChange(member: Member, newRole: string) {
    setBusyUserId(member.user_id);
    try {
      await apiClient.post(`/workspaces/${workspaceId}/members/${member.user_id}/role`, { role: newRole });
      setToast(`${member.name}'s role changed to ${newRole}.`);
      onInvited();
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setToast(detail ?? "Failed to change role");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setBusyUserId(removeTarget.user_id);
    try {
      await apiClient.delete(`/workspaces/${workspaceId}/members/${removeTarget.user_id}`);
      setToast(`${removeTarget.name} removed from the workspace.`);
      onInvited();
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setToast(detail ?? "Failed to remove member");
    } finally {
      setBusyUserId(null);
      setRemoveTarget(null);
    }
  }

  async function handleTransfer() {
    if (!transferTarget) return;
    setBusyUserId(transferTarget.user_id);
    try {
      await apiClient.post(`/workspaces/${workspaceId}/transfer-ownership`, { new_owner_id: transferTarget.user_id });
      setToast(`Ownership transferred to ${transferTarget.name}.`);
      onInvited();
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setToast(detail ?? "Failed to transfer ownership");
    } finally {
      setBusyUserId(null);
      setTransferTarget(null);
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
          {members.map((m) => {
            const isSelf = m.user_id === currentUserId;
            const isTargetOwner = m.role === "owner";
            const busy = busyUserId === m.user_id;
            return (
              <div key={m.user_id} className="flex items-center justify-between gap-3 px-[26px] py-[14px]">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: avatarGradient(m.user_id) }}
                  >
                    {initials(m.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold text-[var(--text)]">
                      {m.name} {isSelf && <span className="text-[var(--faint)]">(you)</span>}
                    </div>
                    <div className="truncate text-[12.5px] text-[var(--faint)]">{m.email}</div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {isAdmin && !isTargetOwner && !isSelf ? (
                    <select
                      value={m.role}
                      disabled={busy}
                      onChange={(e) => handleRoleChange(m, e.target.value)}
                      className="rounded-[var(--r)] border border-[var(--border)] bg-[var(--panel-2)] px-[10px] py-[6px] font-mono text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <RoleChip role={m.role} />
                  )}

                  {isOwner && !isTargetOwner && !isSelf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => setTransferTarget(m)}
                    >
                      Make owner
                    </Button>
                  )}

                  {isAdmin && !isTargetOwner && !isSelf && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      onClick={() => setRemoveTarget(m)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove member">
        <p className="text-[14px] leading-[1.6] text-[var(--muted)]">
          Remove <strong className="text-[var(--text)]">{removeTarget?.name}</strong> from this workspace? They&apos;ll
          lose access to every project immediately.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRemove}>
            Remove member
          </Button>
        </div>
      </Modal>

      <Modal open={!!transferTarget} onClose={() => setTransferTarget(null)} title="Transfer ownership">
        <p className="text-[14px] leading-[1.6] text-[var(--muted)]">
          Make <strong className="text-[var(--text)]">{transferTarget?.name}</strong> the new Owner of this
          workspace? You&apos;ll become an Admin and can no longer delete the workspace.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setTransferTarget(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleTransfer}>
            Transfer ownership
          </Button>
        </div>
      </Modal>

      <Toast message={toast} onDone={() => setToast(null)} />
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

function AccountPanel() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    setSaving(true);
    try {
      await apiClient.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess("Password changed. You'll need to log in again on your other devices.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail ?? "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={panelClass}>
      <h3 className="text-[16px] font-bold text-[var(--text)]">Change password</h3>
      <p className="mt-1 text-[13.5px] text-[var(--muted)]">
        Choose a new password for your CollabAI account. This signs you out everywhere else.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex max-w-[420px] flex-col gap-4">
        <Field label="Current password">
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Field label="New password">
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password">
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>

        {error && <Banner>{error}</Banner>}
        {success && (
          <div className="rounded-[12px] bg-[var(--green-bg)] px-4 py-3 text-[13.5px] text-[var(--green)]">
            {success}
          </div>
        )}

        <Button type="submit" disabled={saving} className="mt-1 self-start">
          {saving ? "Saving…" : "Change password"}
        </Button>
      </form>
    </div>
  );
}

function DangerZonePanel({ workspace, isOwner }: { workspace: Workspace | null; isOwner: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = workspace ? confirmText.trim() === workspace.name : false;

  async function handleDelete() {
    if (!workspace || !confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      await apiClient.delete(`/workspaces/${workspace.id}`);
      router.push("/workspaces");
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail ?? "Failed to delete workspace");
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-[18px] border border-[rgba(251,113,133,.35)] bg-white p-[26px] shadow-[var(--sh-1)]">
      <h3 className="text-[16px] font-bold text-[var(--red)]">Delete this workspace</h3>
      <p className="mt-1 max-w-[520px] text-[13.5px] leading-[1.6] text-[var(--muted)]">
        Permanently deletes every project, document, and message in this workspace. This can&apos;t
        be undone.
        {!isOwner && " Only the Owner can do this."}
      </p>
      <Button variant="danger" className="mt-5" disabled={!isOwner} onClick={() => setOpen(true)}>
        Delete workspace
      </Button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setConfirmText("");
          setError(null);
        }}
        title="Delete workspace"
      >
        <p className="text-[14px] leading-[1.6] text-[var(--muted)]">
          This will permanently delete <strong className="text-[var(--text)]">{workspace?.name}</strong>, including
          every project, document, and message. This can&apos;t be undone.
        </p>
        <div className="mt-5">
          <Field label={`Type "${workspace?.name}" to confirm`}>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus />
          </Field>
        </div>
        {error && (
          <div className="mt-4">
            <Banner>{error}</Banner>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!confirmed || deleting} onClick={handleDelete}>
            {deleting ? "Deleting…" : "Delete workspace"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function SettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [tab, setTab] = useState<Tab>("Workspace");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  function loadMembers() {
    apiClient
      .get<Member[]>(`/workspaces/${workspaceId}/members`)
      .then(({ data }) => setMembers(data))
      .catch(() => {});
  }

  useEffect(() => {
    apiClient
      .get<Workspace[]>("/workspaces")
      .then(({ data }) => {
        setWorkspace(data.find((w) => w.id === workspaceId) ?? null);
      })
      .catch(() => {});
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const currentUserId = getCurrentUserId();
  const currentRole = useMemo(
    () => members.find((m) => m.user_id === currentUserId)?.role ?? null,
    [members, currentUserId]
  );

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
        {tab === "Members" && (
          <MembersPanel
            workspaceId={workspaceId}
            members={members}
            onInvited={loadMembers}
            currentUserId={currentUserId}
            currentRole={currentRole}
          />
        )}
        {tab === "Notifications" && <NotificationsPanel />}
        {tab === "Account" && <AccountPanel />}
        {tab === "Danger zone" && <DangerZonePanel workspace={workspace} isOwner={currentRole === "owner"} />}
      </div>
    </div>
  );
}
