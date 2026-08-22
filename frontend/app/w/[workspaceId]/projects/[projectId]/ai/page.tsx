"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import { useProjectContext } from "@/lib/hooks/useProjectContext";
import type { AIConversationSummary } from "@/lib/types";
import { TOPBAR_HEIGHT } from "@/components/dashboard/Topbar";
import { ProjectPageHeader } from "@/components/projects/ProjectPageHeader";
import { SparkleIcon } from "@/components/ui/icons";
import { QuestionBubble } from "@/components/ai/QuestionBubble";
import { AnswerBubble, type Citation } from "@/components/ai/AnswerBubble";
import { AskComposer } from "@/components/ai/AskComposer";
import { AIConversationSidebar } from "@/components/ai/AIConversationSidebar";

type Exchange = {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  streaming: boolean;
};

type AIMessageHistoryItem = {
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  created_at: string;
};

function exchangesFromHistory(history: AIMessageHistoryItem[]): Exchange[] {
  const exchanges: Exchange[] = [];
  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    if (item.role !== "user") continue;
    const answer = history[i + 1]?.role === "assistant" ? history[i + 1] : null;
    exchanges.push({
      id: `history-${item.created_at}-${i}`,
      question: item.content,
      answer: answer?.content ?? "",
      citations: answer?.citations ?? [],
      streaming: false,
    });
    if (answer) i++;
  }
  return exchanges;
}

export default function AICopilotPage() {
  return (
    <Suspense>
      <AICopilotPageInner />
    </Suspense>
  );
}

function AICopilotPageInner() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("c");
  const scope = searchParams.get("scope") === "workspace" ? "workspace" : "project";
  const { workspaceName, project } = useProjectContext(workspaceId, projectId);
  const [conversations, setConversations] = useState<AIConversationSummary[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scopeParams = scope === "workspace" ? { workspace_id: workspaceId } : { project_id: projectId };

  function loadConversations() {
    apiClient
      .get<AIConversationSummary[]>("/ai/conversations", { params: scopeParams })
      .then(({ data }) => setConversations(data))
      .catch(() => {});
  }

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, scope]);

  useEffect(() => {
    // Skip: this conversation_id was just assigned by our own in-flight ask
    // (see handleAsk's router.replace) — exchanges are already being filled
    // in live from the stream, and the backend hasn't persisted the
    // assistant's answer yet, so re-fetching now would clobber it with an
    // incomplete history.
    if (asking) return;

    const load = conversationId
      ? apiClient
          .get<AIMessageHistoryItem[]>(`/ai/conversations/${conversationId}/messages`, { params: scopeParams })
          .then(({ data }) => exchangesFromHistory(data))
          .catch(() => [] as Exchange[])
      : Promise.resolve([] as Exchange[]);

    load.then(setExchanges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, conversationId, scope]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [exchanges]);

  function patchLast(id: string, patch: Partial<Exchange>) {
    setExchanges((prev) => prev.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)));
  }

  function selectConversation(id: string) {
    const scopeQuery = scope === "workspace" ? "&scope=workspace" : "";
    router.replace(`/w/${workspaceId}/projects/${projectId}/ai?c=${id}${scopeQuery}`);
  }

  function newChat() {
    const scopeQuery = scope === "workspace" ? "?scope=workspace" : "";
    router.replace(`/w/${workspaceId}/projects/${projectId}/ai${scopeQuery}`);
  }

  function setScope(next: "project" | "workspace") {
    router.replace(`/w/${workspaceId}/projects/${projectId}/ai${next === "workspace" ? "?scope=workspace" : ""}`);
  }

  async function handleAsk(question: string) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setExchanges((prev) => [...prev, { id, question, answer: "", citations: [], streaming: true }]);
    setAsking(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
      const response = await fetch(`${apiBase}/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ ...scopeParams, question, conversation_id: conversationId }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = "";
      let answer = "";
      const isNewConversation = !conversationId;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6));
          if (event.type === "conversation" && isNewConversation) {
            selectConversation(event.conversation_id);
          } else if (event.type === "token") {
            answer += event.text;
            patchLast(id, { answer });
          } else if (event.type === "citations") {
            patchLast(id, { citations: event.citations, streaming: false });
          }
        }
      }
    } finally {
      patchLast(id, { streaming: false });
      setAsking(false);
      loadConversations();
    }
  }

  return (
    <div className="flex flex-col" style={{ height: `calc(100vh - ${TOPBAR_HEIGHT}px)` }}>
      <ProjectPageHeader
        workspaceId={workspaceId}
        projectId={projectId}
        workspaceName={workspaceName}
        projectName={project?.name ?? ""}
      />

      <div className="flex min-h-0 flex-1">
        <AIConversationSidebar
          conversations={conversations}
          activeConversationId={conversationId}
          onSelect={selectConversation}
          onNewChat={newChat}
        />

        <div className="mx-auto flex min-h-0 w-full max-w-[880px] flex-1 flex-col px-6 py-6">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-[10px]">
            <div className="flex items-center gap-[10px]">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[image:var(--grad)] shadow-[var(--sh-accent)]">
                <SparkleIcon size={16} stroke="#fff" strokeWidth={2.2} />
              </span>
              <div>
                <h1 className="text-[16px] font-extrabold tracking-[-.01em] text-[var(--text)]">Ask CollabAI</h1>
                <p className="text-[12.5px] text-[var(--muted)]">
                  {scope === "workspace"
                    ? "Grounded in every project you can see in this workspace."
                    : "Grounded in this project's documents, every claim cited."}
                </p>
              </div>
            </div>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as "project" | "workspace")}
              className="rounded-[var(--r)] border border-[var(--border)] bg-[var(--panel-2)] px-3 py-[7px] font-sans text-[12.5px] font-semibold text-[var(--text)] outline-none focus:border-[var(--accent)]"
            >
              <option value="project">This project</option>
              <option value="workspace">Entire workspace</option>
            </select>
          </div>

          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-2">
            {exchanges.length === 0 ? (
              <div className="m-auto max-w-[440px] text-center">
                <h2 className="text-[22px] leading-[1.2] font-extrabold tracking-[-.02em] text-[var(--text)] text-balance">
                  Drop a PDF. Ask a hard question.
                  <br />
                  Get a <span className="grad-text">cited answer</span>.
                </h2>
                <p className="mt-3 text-[13.5px] leading-[1.6] text-[var(--muted)]">
                  Ask in plain language — every answer links back to the exact document it came from.
                </p>
              </div>
            ) : (
              exchanges.map((ex) => (
                <div key={ex.id} className="flex flex-col gap-3">
                  <QuestionBubble text={ex.question} />
                  <AnswerBubble
                    content={ex.answer}
                    citations={ex.citations}
                    streaming={ex.streaming}
                    workspaceId={workspaceId}
                    projectId={projectId}
                  />
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 pt-3">
            <AskComposer disabled={asking} onAsk={handleAsk} />
          </div>
        </div>
      </div>
    </div>
  );
}
