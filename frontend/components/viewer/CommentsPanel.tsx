"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useComments } from "@/lib/hooks/useComments";
import { CommentThread } from "@/components/viewer/CommentThread";

function ThreadSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-[var(--border)] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="h-[26px] w-[26px] shrink-0 animate-pulse rounded-full bg-[var(--panel-3)]" />
        <div className="flex-1">
          <div className="h-[11px] w-[90px] animate-pulse rounded-[5px] bg-[var(--panel-3)]" />
          <div className="mt-2 h-[13px] w-4/5 animate-pulse rounded-[5px] bg-[var(--panel-3)]" />
        </div>
      </div>
    </div>
  );
}

export function CommentsPanel({
  documentId,
  resolveAuthor,
}: {
  documentId: string;
  resolveAuthor: (userId: string) => string;
}) {
  const { comments, loading, addComment, toggleResolve } = useComments(documentId);
  const [text, setText] = useState("");

  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const repliesFor = (id: string) => comments.filter((c) => c.parent_comment_id === id);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value) return;
    addComment(value, null);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="shrink-0 border-b border-[var(--border)] p-4">
        <div className="mb-3 font-mono text-[11px] font-bold tracking-[.05em] text-[var(--faint)]">
          COMMENTS · {loading ? "—" : topLevel.length}
        </div>
        <form onSubmit={submit} className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Add a comment… (⌘+Enter to send)"
            className="w-full resize-none rounded-[10px] border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)] focus:bg-white"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="self-end rounded-[8px] px-4 py-[7px] text-[12.5px] font-semibold text-white shadow-[var(--sh-accent)] disabled:opacity-40 disabled:shadow-none bg-[image:var(--grad)]"
          >
            Comment
          </button>
        </form>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {loading ? (
          <>
            <ThreadSkeleton />
            <ThreadSkeleton />
          </>
        ) : topLevel.length === 0 ? (
          <p className="mt-8 text-center text-[13px] text-[var(--faint)]">
            No comments yet. Start the conversation.
          </p>
        ) : (
          topLevel.map((c) => (
            <CommentThread
              key={c.id}
              comment={c}
              replies={repliesFor(c.id)}
              resolveAuthor={resolveAuthor}
              onToggleResolve={() => toggleResolve(c)}
              onReply={(content) => addComment(content, c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
