import Link from "next/link";

export function CitationCard({
  index,
  filename,
  pageOrSection,
  workspaceId,
  projectId,
  documentId,
  quote,
}: {
  index: number;
  filename: string;
  pageOrSection: string | null;
  workspaceId: string;
  projectId: string;
  documentId: string;
  quote: string | null;
}) {
  const params = new URLSearchParams();
  const pageNumber = pageOrSection?.match(/\d+/)?.[0];
  if (pageNumber) params.set("page", pageNumber);
  if (quote) params.set("quote", quote);
  const query = params.toString();
  const href = `/w/${workspaceId}/projects/${projectId}/documents/${documentId}${query ? `?${query}` : ""}`;

  return (
    <Link
      href={href}
      className="block max-w-[300px] rounded-[12px] border border-[var(--border-2)] bg-white p-[12px_14px] shadow-[var(--sh-1)] transition-[transform,box-shadow] duration-200 ease-[var(--ease-out)] hover:-translate-y-[2px] hover:shadow-[var(--sh-2)]"
    >
      <div className="font-mono text-[10px] font-bold tracking-[.05em] text-[var(--faint)]">
        SOURCE [{index}] · {filename.toUpperCase()}
        {pageOrSection ? ` · ${pageOrSection.toUpperCase()}` : ""}
      </div>
      <div className="mt-[8px] text-[12px] font-semibold text-[var(--accent-soft)]">Open &amp; comment →</div>
    </Link>
  );
}
