"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { getAccessToken } from "@/lib/auth";

type Citation = { document_id: string; filename: string; page_or_section: string | null };

export default function AICopilotPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    setAnswer("");
    setCitations([]);
    setLoading(true);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    const response = await fetch(`${apiBase}/ai/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({ project_id: projectId, question }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const event = JSON.parse(line.slice(6));
        if (event.type === "token") {
          setAnswer((prev) => prev + event.text);
        } else if (event.type === "citations") {
          setCitations(event.citations);
        }
      }
    }

    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        AI Copilot
      </h1>

      <form onSubmit={handleAsk} className="mb-6 flex gap-2">
        <input
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this project's documents…"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      {answer && (
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-50">
            {answer}
          </p>

          {citations.length > 0 && (
            <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <p className="mb-1 text-xs font-medium text-zinc-500">Sources:</p>
              {citations.map((c, i) => (
                <p key={i} className="text-xs text-zinc-500">
                  [{i + 1}] {c.filename}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}