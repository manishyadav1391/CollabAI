"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

/** Online/offline presence per workspace member (FR-CHAT-04). Fetches an
 * initial snapshot, then keeps it live over the same `/ws/notifications`
 * socket used for the notification bell — see backend app/core/presence.py. */
export function usePresence(workspaceId: string) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!workspaceId) return;

    apiClient
      .get<{ online_user_ids: string[] }>(`/workspaces/${workspaceId}/online-members`)
      .then(({ data }) => setOnlineUserIds(new Set(data.online_user_ids)))
      .catch(() => {});

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    const wsBase = apiBase.replace(/^http/, "ws");
    const token = getAccessToken();
    if (!token) return;

    const ws = new WebSocket(`${wsBase}/ws/notifications?token=${token}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event !== "presence") return;
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (data.online) next.add(data.user_id);
        else next.delete(data.user_id);
        return next;
      });
    };
    return () => ws.close();
  }, [workspaceId]);

  return onlineUserIds;
}
