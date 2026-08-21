import Link from "next/link";

export function CitationCard({
  index,
  filename,
  pageOrSection,
  href,
}: {
  index: number;
  filename: string;
  pageOrSection: string | null;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block max-w-[300px] rounded-[12px] border border-[var(--border-2)] bg-white p-[12px_14px] shadow-[var(--sh-1)] transition-[transform,box-shadow] duration-200 ease-[var(--ease-out)] hover:-translate-y-[2px] hover:shadow-[var(--sh-2)]"
    >
      <div className="font-mono text-[10px] font-bold tracking-[.05em] text-[var(--faint)]">
        SOURCE [{index}] · {filename.toUpperCase()}
        {pageOrSection ? ` · ${pageOrSection.toUpperCase()}` : ""}
      </div>
      <div className="mt-[8px] text-[12px] font-semibold text-[var(--accent-soft)]">Open document →</div>
    </Link>
  );
}
