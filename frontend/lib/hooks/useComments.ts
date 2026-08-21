"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { getCurrentUserId } from "@/lib/auth";
import type { Comment } from "@/lib/types";

export type OptimisticComment = Comment & { pending?: boolean; failed?: boolean };

export function useComments(documentId: string) {
  const [comments, setComments] = useState<OptimisticComment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return apiClient
      .get<Comment[]>(`/documents/${documentId}/comments`)
      .then(({ data }) => setComments(data))
      .catch(() => {})
      .then(() => setLoading(false));
  }, [documentId]);

  useEffect(() => {
    load();
  }, [load]);

  function addComment(content: string, parentCommentId: string | null) {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: OptimisticComment = {
      id: tempId,
      parent_comment_id: parentCommentId,
      author_id: getCurrentUserId() ?? "",
      content,
      status: "open",
      created_at: new Date().toISOString(),
      pending: true,
    };
    setComments((prev) => [...prev, optimistic]);

    return apiClient
      .post<Comment>(`/documents/${documentId}/comments`, {
        content,
        parent_comment_id: parentCommentId,
      })
      .then(({ data }) => {
        setComments((prev) => prev.map((c) => (c.id === tempId ? data : c)));
      })
      .catch(() => {
        setComments((prev) => prev.map((c) => (c.id === tempId ? { ...c, pending: false, failed: true } : c)));
      });
  }

  function toggleResolve(comment: Comment) {
    const next = comment.status === "open" ? "resolved" : "open";
    setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, status: next } : c)));

    const endpoint = comment.status === "open" ? "resolve" : "reopen";
    return apiClient.put(`/comments/${comment.id}/${endpoint}`).catch(() => load());
  }

  return { comments, loading, addComment, toggleResolve };
}
