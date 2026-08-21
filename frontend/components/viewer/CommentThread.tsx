"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { avatarGradient, formatRelativeTime, initials } from "@/lib/format";
import { CheckIcon } from "@/components/documents/icons";
import type { OptimisticComment } from "@/lib/hooks/useComments";

function Avatar({ name, size = 26 }: { name: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: avatarGradient(name) }}
    >
      {initials(name)}
    </span>
  );
}

export function CommentThread({
  comment,
  replies,
  resolveAuthor,
  onToggleResolve,
  onReply,
}: {
  comment: OptimisticComment;
  replies: OptimisticComment[];
  resolveAuthor: (userId: string) => string;
  onToggleResolve: () => void;
  onReply: (content: string) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const resolved = comment.status === "resolved";

  function submitReply(e: FormEvent) {
    e.preventDefault();
    const text = replyText.trim();
    if (!text) return;
    onReply(text);
    setReplyText("");
    setReplyOpen(false);
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-[14px] border border-[var(--border)] bg-white p-4 transition-opacity duration-300"
      style={{ opacity: resolved ? 0.55 : 1 }}
    >
      <div className="flex items-start gap-3">
        <Avatar name={resolveAuthor(comment.author_id)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-[7px]">
            <span className="text-[13px] font-bold text-[var(--text)]">{resolveAuthor(comment.author_id)}</span>
            <span className="font-mono text-[10.5px] text-[var(--faint)]">
              {formatRelativeTime(comment.created_at)}
            </span>
            {comment.pending && <span className="text-[10.5px] text-[var(--faint)] italic">sending…</span>}
            {comment.failed && <span className="text-[10.5px] font-semibold text-[var(--red)]">failed to send</span>}
          </div>
          <p className="mt-1 text-[13.5px] leading-[1.55] text-[var(--text)]">{comment.content}</p>
        </div>
        <button
          type="button"
          onClick={onToggleResolve}
          title={resolved ? "Reopen thread" : "Mark resolved"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors"
          style={{
            background: resolved ? "var(--green-bg)" : "var(--panel-2)",
            color: resolved ? "var(--green)" : "var(--faint)",
          }}
        >
          <CheckIcon size={13} strokeWidth={2.6} />
        </button>
      </div>

      {resolved && (
        <span className="ml-[38px] inline-flex w-fit items-center rounded-[100px] bg-[var(--green-bg)] px-[9px] py-[3px] font-mono text-[10px] font-bold tracking-[.05em] text-[var(--green)]">
          RESOLVED
        </span>
      )}

      {!resolved && replies.length > 0 && (
        <div className="ml-[13px] flex flex-col gap-3 border-l-2 border-[var(--border)] py-1 pl-4">
          {replies.map((r) => (
            <div key={r.id} className="flex items-start gap-[10px]">
              <Avatar name={resolveAuthor(r.author_id)} size={22} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-[6px]">
                  <span className="text-[12.5px] font-bold text-[var(--text)]">{resolveAuthor(r.author_id)}</span>
                  <span className="font-mono text-[10px] text-[var(--faint)]">{formatRelativeTime(r.created_at)}</span>
                  {r.pending && <span className="text-[10px] text-[var(--faint)] italic">sending…</span>}
                </div>
                <p className="mt-[2px] text-[13px] leading-[1.5] text-[var(--muted)]">{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!resolved &&
        (replyOpen ? (
          <form onSubmit={submitReply} className="ml-[38px] flex gap-2">
            <input
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply…"
              className="flex-1 rounded-[10px] border border-[var(--border)] bg-[var(--panel-2)] px-3 py-[7px] text-[12.5px] text-[var(--text)] outline-none focus:border-[var(--accent)] focus:bg-white"
            />
            <button type="submit" className="text-[12px] font-semibold text-[var(--accent-soft)]">
              Send
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            className="ml-[38px] w-fit text-[12px] font-semibold text-[var(--muted)] hover:text-[var(--accent-soft)]"
          >
            Reply
          </button>
        ))}
    </div>
  );
}
