"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { getAccessToken, getCurrentUserId } from "@/lib/auth";
import { useProjectContext } from "@/lib/hooks/useProjectContext";
import type { ChatMessage, DMThread } from "@/lib/types";
import { avatarGradient, formatRelativeTime, initials } from "@/lib/format";
import { TOPBAR_HEIGHT } from "@/components/dashboard/Topbar";
import { ProjectPageHeader } from "@/components/projects/ProjectPageHeader";
import { Button } from "@/components/ui/Button";
import { ConversationSidebar, type ActiveTarget } from "@/components/chat/ConversationSidebar";

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dmUserId = searchParams.get("dm");
  const { workspaceName, project, members, memberName } = useProjectContext(workspaceId, projectId);
  const currentUserId = getCurrentUserId();

  const activeTarget: ActiveTarget = dmUserId ? { kind: "dm", userId: dmUserId } : { kind: "room" };
  const activeKey = activeTarget.kind === "dm" ? `dm:${activeTarget.userId}` : "room";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dmThreads, setDmThreads] = useState<DMThread[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function selectTarget(target: ActiveTarget) {
    const query = target.kind === "dm" ? `?dm=${target.userId}` : "";
    router.replace(`/w/${workspaceId}/projects/${projectId}/chat${query}`);
  }

  function loadDmThreads() {
    apiClient
      .get<{ threads: DMThread[] }>(`/ws/chat/${projectId}/dm-threads`)
      .then(({ data }) => setDmThreads(data.threads))
      .catch(() => {});
  }

  useEffect(() => {
    loadDmThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    const historyPath =
      activeTarget.kind === "dm"
        ? `/ws/chat/${projectId}/dm/${activeTarget.userId}/history`
        : `/ws/chat/${projectId}/history`;

    apiClient
      .get<{ messages: ChatMessage[] }>(historyPath)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => setMessages([]));

    if (activeTarget.kind === "dm") loadDmThreads();

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    const wsBase = apiBase.replace(/^http/, "ws");
    const token = getAccessToken();
    const wsPath =
      activeTarget.kind === "dm" ? `/ws/dm/${projectId}/${activeTarget.userId}` : `/ws/chat/${projectId}`;
    const ws = new WebSocket(`${wsBase}${wsPath}?token=${token}`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const message: ChatMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
      if (activeTarget.kind === "dm") loadDmThreads();
    };

    wsRef.current = ws;
    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, activeKey]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content }));
    setInput("");
  }

  const headerTitle =
    activeTarget.kind === "dm" ? memberName(activeTarget.userId, currentUserId) : "Team chat";

  return (
    <div className="flex flex-col" style={{ height: `calc(100vh - ${TOPBAR_HEIGHT}px)` }}>
      <ProjectPageHeader
        workspaceId={workspaceId}
        projectId={projectId}
        workspaceName={workspaceName}
        projectName={project?.name ?? ""}
      />

      <div className="flex min-h-0 flex-1">
        <ConversationSidebar
          members={members}
          currentUserId={currentUserId}
          dmThreads={dmThreads}
          activeTarget={activeTarget}
          onSelect={selectTarget}
        />

        <div className="mx-auto flex min-h-0 w-full max-w-[820px] flex-1 flex-col px-6 py-4">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h1 className="text-[16px] font-extrabold tracking-[-.01em] text-[var(--text)]">{headerTitle}</h1>
            <span className="flex items-center gap-[6px] text-[12px]" style={{ color: connected ? "var(--green)" : "var(--faint)" }}>
              <span
                className="h-[6px] w-[6px] rounded-full"
                style={{ background: connected ? "#34d399" : "var(--faint)" }}
              />
              {connected ? "Connected" : "Reconnecting…"}
            </span>
          </div>

          <div
            ref={scrollRef}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-[14px] border border-[var(--border)] bg-white p-4"
          >
            {messages.length === 0 ? (
              <p className="m-auto text-center text-[13px] text-[var(--faint)]">
                {activeTarget.kind === "dm"
                  ? `No messages yet. Say hello to ${headerTitle}.`
                  : "No messages yet. Say hello to the team."}
              </p>
            ) : (
              messages.map((m) => {
                const name = memberName(m.sender_id, currentUserId);
                return (
                  <div key={m.id} className="flex items-start gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: avatarGradient(m.sender_id) }}
                    >
                      {initials(name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[var(--text)]">{name}</span>
                        <span className="font-mono text-[10.5px] text-[var(--faint)]">
                          {formatRelativeTime(m.created_at)}
                        </span>
                      </div>
                      <p className="mt-[2px] text-[13.5px] leading-[1.55] break-words text-[var(--text)]">
                        {m.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="mt-3 flex shrink-0 items-center gap-2 rounded-[100px] border border-[var(--border)] bg-white p-[7px] shadow-[var(--sh-1)]"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeTarget.kind === "dm" ? `Message ${headerTitle}…` : "Message the team…"}
              className="flex-1 border-0 bg-transparent px-4 font-sans text-[14px] text-[var(--text)] outline-none placeholder:text-[var(--faint)]"
            />
            <Button type="submit" size="sm" disabled={!input.trim()} className="rounded-[100px] px-5 py-[10px]">
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
