"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDownIcon, SparkleIcon } from "@/components/ui/icons";
import { CitationCard } from "@/components/ai/CitationCard";

export type Citation = {
  document_id: string;
  filename: string;
  page_or_section: string | null;
  chunk_text?: string | null;
};

const markdownComponents = {
  h1: (props: React.ComponentPropsWithoutRef<"h1">) => (
    <h1 className="mt-4 mb-2 text-[18px] font-extrabold tracking-[-.01em] text-[var(--text)] first:mt-0" {...props} />
  ),
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-4 mb-2 text-[16px] font-extrabold tracking-[-.01em] text-[var(--text)] first:mt-0" {...props} />
  ),
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-3 mb-1 text-[14.5px] font-bold text-[var(--text)] first:mt-0" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => (
    <p className="mb-3 leading-[1.7] last:mb-0" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => <li className="leading-[1.6]" {...props} />,
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-bold text-[var(--text)]" {...props} />
  ),
  em: (props: React.ComponentPropsWithoutRef<"em">) => <em className="italic" {...props} />,
  a: (props: React.ComponentPropsWithoutRef<"a">) => (
    <a className="font-semibold text-[var(--accent-soft)] underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />
  ),
  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="mb-3 border-l-[3px] border-[var(--border-2)] pl-3 text-[var(--muted)] last:mb-0" {...props} />
  ),
  code: (props: React.ComponentPropsWithoutRef<"code">) => (
    <code
      className="rounded-[4px] bg-white px-[5px] py-[2px] font-mono text-[13px] [pre_&]:bg-transparent [pre_&]:p-0"
      {...props}
    />
  ),
  pre: (props: React.ComponentPropsWithoutRef<"pre">) => (
    <pre className="mb-3 overflow-x-auto rounded-[10px] border border-[var(--border-2)] bg-white p-3 font-mono text-[13px] last:mb-0" {...props} />
  ),
};

export function AnswerBubble({
  content,
  citations,
  streaming,
  workspaceId,
  projectId,
}: {
  content: string;
  citations: Citation[];
  streaming: boolean;
  workspaceId: string;
  projectId: string;
}) {
  const [showSources, setShowSources] = useState(false);

  return (
    <div
      className="max-w-[88%] rounded-[14px_14px_14px_4px] border border-[var(--border)] bg-[var(--panel-2)] p-4"
      style={{ animation: "om-rise .4s cubic-bezier(.2,.7,.2,1) both" }}
    >
      <div className="mb-[10px] flex items-center gap-[9px]">
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-[image:var(--grad)]">
          <SparkleIcon size={12} stroke="#fff" strokeWidth={2.4} />
        </span>
        <span className="text-[12px] font-bold text-[var(--text)]">CollabAI</span>
        {!streaming && citations.length === 0 && (
          <span className="font-mono text-[10px] text-[var(--faint)]">no matching passages</span>
        )}
      </div>

      <div className="text-[14.5px] leading-[1.7] text-[var(--text)]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
        {streaming && (
          <span
            className="ml-[2px] inline-block h-[14px] w-[2px] align-[-2px]"
            style={{ background: "var(--text)", animation: "om-blink 1s steps(1) infinite" }}
          />
        )}
      </div>

      {!streaming && citations.length > 0 && (
        <div className="mt-[12px]">
          <button
            type="button"
            onClick={() => setShowSources((v) => !v)}
            className="flex items-center gap-[6px] rounded-[8px] px-[2px] py-1 font-mono text-[11px] font-bold text-[var(--accent-soft)] transition-colors hover:text-[var(--text)]"
          >
            {showSources ? "Hide" : "Show"} {citations.length} source{citations.length === 1 ? "" : "s"}
            <ChevronDownIcon
              size={13}
              strokeWidth={2.4}
              style={{ transform: showSources ? "rotate(180deg)" : "none", transition: "transform .15s" }}
            />
          </button>

          {showSources && (
            <div className="mt-[10px] flex flex-wrap gap-[10px]">
              {citations.map((c, i) => (
                <CitationCard
                  key={c.document_id + i}
                  index={i + 1}
                  filename={c.filename}
                  pageOrSection={c.page_or_section}
                  workspaceId={workspaceId}
                  projectId={projectId}
                  documentId={c.document_id}
                  quote={c.chunk_text ?? null}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
