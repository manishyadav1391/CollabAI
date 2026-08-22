"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/format";
import { BellIcon } from "@/components/dashboard/icons";
import type { Notification } from "@/lib/types";

function describe(notif: Notification): string {
  const payload = notif.payload as { filename?: string; kind?: string; preview?: string } | null;
  switch (notif.type) {
    case "new_message": {
      const kind = payload?.kind === "room" ? "Team chat" : "New message";
      const preview = payload?.preview ?? "";
      return preview ? `${kind}: ${preview}` : kind;
    }
    case "mention":
      return "You were mentioned in a comment";
    case "upload":
      return payload?.filename ? `New document: ${payload.filename}` : "New document uploaded";
    case "added_to_project":
      return "You were added to a project";
    case "processing_done":
      return payload?.filename ? `${payload.filename} is ready` : "Document processing complete";
    case "processing_failed":
      return payload?.filename ? `${payload.filename} failed to process` : "Document processing failed";
    default:
      return notif.type.replace(/_/g, " ");
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSelect(notif: Notification) {
    markRead(notif.id);
    setOpen(false);
    const { workspace_id, project_id, document_id } = notif.payload ?? {};

    if (notif.type === "new_message" && workspace_id && project_id) {
      const query = notif.payload?.kind === "dm" ? `?dm=${notif.payload.sender_id}` : "";
      router.push(`/w/${workspace_id}/projects/${project_id}/chat${query}`);
    } else if ((notif.type === "mention" || notif.type === "upload" || notif.type === "processing_done" || notif.type === "processing_failed") && workspace_id && project_id && document_id) {
      router.push(`/w/${workspace_id}/projects/${project_id}/documents/${document_id}`);
    } else if (notif.type === "added_to_project" && workspace_id && project_id) {
      router.push(`/w/${workspace_id}/projects/${project_id}`);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
        aria-label="Notifications"
      >
        <BellIcon size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-[2px] -top-[2px] flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[var(--red)] px-[3px] text-[9.5px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[340px] overflow-hidden rounded-[14px] border border-[var(--border)] bg-white shadow-[var(--sh-2)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <span className="text-[13px] font-semibold text-[var(--text)]">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-[12px] font-semibold text-[var(--accent-soft)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12.5px] text-[var(--faint)]">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleSelect(n)}
                  className={`flex w-full items-start gap-2 border-b border-[var(--border)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--panel-2)] ${
                    n.read_at ? "" : "bg-[var(--green-bg)]"
                  }`}
                >
                  <span
                    className="mt-[6px] h-[6px] w-[6px] shrink-0 rounded-full"
                    style={{ background: n.read_at ? "transparent" : "var(--green)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--text)]">{describe(n)}</p>
                    <p className="mt-[2px] text-[11.5px] text-[var(--faint)]">{formatRelativeTime(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
