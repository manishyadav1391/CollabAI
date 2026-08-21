import Link from "next/link";
import { ChevronRightIcon } from "@/components/documents/icons";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-[6px] text-[13.5px]">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-[6px]">
            {item.href && !isLast ? (
              <Link href={item.href} className="text-[var(--muted)] hover:text-[var(--text)]">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-[var(--text)]" : "text-[var(--muted)]"}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRightIcon size={13} stroke="var(--faint)" />}
          </span>
        );
      })}
    </div>
  );
}
