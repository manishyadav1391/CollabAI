"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";

type Message = { id: string; sender_id: string; content: string; sequence_number: number };

export default function ChatPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    apiClient.get(`/ws/chat/${projectId}/history`).then(({ data }) => setMessages(data.messages));

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    const wsBase = apiBase.replace("http", "ws");
    const token = getAccessToken();
    const ws = new WebSocket(`${wsBase}/ws/chat/${projectId}?token=${token}`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [projectId]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ content: input }));
    setInput("");
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-60px)] max-w-2xl flex-col px-6 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Chat</h1>
        <span className={`text-xs ${connected ? "text-green-600" : "text-zinc-400"}`}>
          {connected ? "● Connected" : "○ Reconnecting…"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        {messages.map((m) => (
          <div key={m.id} className="mb-2 text-sm">
            <span className="text-zinc-900 dark:text-zinc-50">{m.content}</span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
          Send
        </button>
      </form>
    </div>
  );
}