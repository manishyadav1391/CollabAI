"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/lib/hooks/useSearch";
import { SearchIcon } from "@/components/dashboard/icons";
import type { SearchResult } from "@/lib/types";

function renderSnippet(snippet: string) {
  // ts_headline wraps matches in literal "<b>...</b>" text markers — split
  // on them as plain text (never dangerouslySetInnerHTML) so anything the
  // source document itself contains renders as inert text, not markup.
  return snippet.split(/(<b>.*?<\/b>)/g).map((part, i) => {
    const match = part.match(/^<b>(.*)<\/b>$/);
    if (match) {
      return (
        <mark key={i} className="rounded-[3px] bg-[rgba(124,108,255,.22)] px-[1px] text-[var(--text)] font-semibold">
          {match[1]}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function SearchModal({
  open,
  onClose,
  workspaceId,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}) {
  const router = useRouter();
  const { query, setQuery, results, loading, hasMore, loadingMore, loadMore, reset } = useSearch(workspaceId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  function handleClose() {
    onClose();
    reset();
  }

  function openResult(result: SearchResult) {
    handleClose();
    router.push(`/w/${workspaceId}/projects/${result.project_id}/documents/${result.document_id}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-[rgba(18,18,40,.32)] backdrop-blur-[3px]"
        style={{ animation: "om-rise .2s ease-out both" }}
        onClick={handleClose}
      />
      <div
        className="relative flex max-h-[70vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-white shadow-[var(--sh-2)]"
        style={{ animation: "om-rise .25s cubic-bezier(.2,.7,.2,1) both" }}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] px-5 py-4">
          <SearchIcon size={17} stroke="var(--faint)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="flex-1 border-0 bg-transparent font-sans text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--faint)]"
          />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[var(--faint)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!query.trim() ? (
            <p className="px-5 py-10 text-center text-[13px] text-[var(--faint)]">
              Search document text across every project you can access.
            </p>
          ) : loading && results.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[var(--faint)]">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[var(--faint)]">
              No results for &quot;{query}&quot;.
            </p>
          ) : (
            <>
              <div className="divide-y divide-[var(--border)]">
                {results.map((r, i) => (
                  <button
                    key={`${r.document_id}-${i}`}
                    type="button"
                    onClick={() => openResult(r)}
                    className="block w-full px-5 py-[14px] text-left transition-colors hover:bg-[var(--panel-2)]"
                  >
                    <div className="truncate text-[13.5px] font-bold text-[var(--text)]">{r.filename}</div>
                    <div className="mt-[3px] line-clamp-2 text-[12.5px] leading-[1.5] text-[var(--muted)]">
                      {renderSnippet(r.snippet)}
                    </div>
                  </button>
                ))}
              </div>
              {hasMore && (
                <div className="p-3 text-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="rounded-[100px] border border-[var(--border)] bg-[var(--panel-2)] px-4 py-[6px] font-mono text-[11px] font-bold text-[var(--muted)] transition-colors hover:text-[var(--text)] disabled:opacity-50"
                  >
                    {loadingMore ? "Loading…" : "Load more results"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
