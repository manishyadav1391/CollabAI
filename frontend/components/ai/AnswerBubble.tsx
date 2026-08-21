import { SparkleIcon } from "@/components/ui/icons";
import { CitationCard } from "@/components/ai/CitationCard";

export type Citation = { document_id: string; filename: string; page_or_section: string | null };

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
        {!streaming && (
          <span className="font-mono text-[10px] text-[var(--faint)]">
            {citations.length > 0
              ? `grounded in ${citations.length} passage${citations.length === 1 ? "" : "s"}`
              : "no matching passages"}
          </span>
        )}
      </div>

      <div className="text-[14.5px] leading-[1.7] whitespace-pre-wrap text-[var(--text)]">
        {content}
        {streaming && (
          <span
            className="ml-[2px] inline-block h-[14px] w-[2px] align-[-2px]"
            style={{ background: "var(--text)", animation: "om-blink 1s steps(1) infinite" }}
          />
        )}
      </div>

      {citations.length > 0 && (
        <div className="mt-[14px] flex flex-wrap gap-[10px]">
          {citations.map((c, i) => (
            <CitationCard
              key={c.document_id + i}
              index={i + 1}
              filename={c.filename}
              pageOrSection={c.page_or_section}
              href={`/w/${workspaceId}/projects/${projectId}/documents/${c.document_id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
