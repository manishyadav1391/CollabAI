"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";

type Comment = {
  id: string;
  parent_comment_id: string | null;
  author_id: string;
  content: string;
  status: string;
};

export default function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  function load() {
    apiClient.get(`/documents/${documentId}/comments`).then(({ data }) => setComments(data));
  }

  useEffect(load, [documentId]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    await apiClient.post(`/documents/${documentId}/comments`, { content: newComment });
    setNewComment("");
    load();
  }

  async function toggleResolve(comment: Comment) {
    const endpoint = comment.status === "open" ? "resolve" : "reopen";
    await apiClient.put(`/comments/${comment.id}/${endpoint}`);
    load();
  }

  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const repliesFor = (id: string) => comments.filter((c) => c.parent_comment_id === id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Comments
      </h1>

      <div className="mb-6 flex flex-col gap-3">
        {topLevel.map((c) => (
          <div key={c.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <p className={`text-sm ${c.status === "resolved" ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-50"}`}>
              {c.content}
            </p>
            <button
              onClick={() => toggleResolve(c)}
              className="mt-1 text-xs font-medium text-zinc-500 underline"
            >
              {c.status === "open" ? "Mark resolved" : "Reopen"}
            </button>

            {repliesFor(c.id).map((r) => (
              <div key={r.id} className="ml-4 mt-2 border-l border-zinc-200 pl-3 dark:border-zinc-700">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{r.content}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      <form onSubmit={submitComment} className="flex gap-2">
        <input
          required
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
          Post
        </button>
      </form>
    </div>
  );
}