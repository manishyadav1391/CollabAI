"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import type { Notification } from "@/lib/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const load = useCallback(() => {
    apiClient
      .get<Notification[]>("/notifications")
      .then(({ data }) => setNotifications(data))
      .catch(() => {});
    apiClient
      .get<{ count: number }>("/notifications/unread-count")
      .then(({ data }) => setUnreadCount(data.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    const wsBase = apiBase.replace(/^http/, "ws");
    const token = getAccessToken();
    if (!token) return;

    const ws = new WebSocket(`${wsBase}/ws/notifications?token=${token}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // This socket also carries presence deltas (FR-CHAT-04, see
      // usePresence) — they aren't notifications, so skip them here.
      if (data.event === "presence") return;
      const notif: Notification = data;
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };
    wsRef.current = ws;
    return () => ws.close();
  }, [load]);

  function markRead(id: string) {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read_at) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n));
    });
    return apiClient.put(`/notifications/${id}/read`).catch(() => {});
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
    return apiClient.put("/notifications/mark-all-read").catch(() => {});
  }

  return { notifications, unreadCount, markRead, markAllRead };
}
