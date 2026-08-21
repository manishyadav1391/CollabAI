import Link from "next/link";
import { HexagonIcon } from "@/components/ui/icons";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "PRODUCT",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "How it works", href: "#how" },
    ],
  },
  {
    title: "COMPANY",
    links: [
      { label: "Privacy policy", href: "#top" },
      { label: "Terms of service", href: "#top" },
      { label: "Security", href: "#top" },
    ],
  },
  {
    title: "CONNECT",
    links: [
      { label: "Twitter", href: "#top" },
      { label: "GitHub", href: "#top" },
      { label: "hello@collabai.app", href: "mailto:hello@collabai.app" },
    ],
  },
];

export function Footer() {
  return (
    <footer data-screen-label="Footer" className="relative z-[1] mt-[110px] border-t border-[var(--border)] bg-[var(--panel-2)]">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 px-[30px] pt-14 pb-[30px] sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-[10px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[image:var(--grad)]">
              <HexagonIcon size={15} stroke="#fff" />
            </span>
            <span className="text-[16px] font-extrabold tracking-[-.02em]">CollabAI</span>
          </div>
          <p className="mt-[14px] max-w-[280px] text-[13.5px] leading-[1.6] text-[var(--muted)]">
            A secure AI workspace for teams who work out of documents.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-[10px]">
            <div className="font-mono text-[11px] font-bold tracking-[.05em] text-[var(--faint)]">
              {col.title}
            </div>
            {col.links.map((l) => (
              <Link key={l.label} href={l.href} className="text-[13.5px] text-[var(--muted)] hover:text-[var(--text)]">
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-[1180px] border-t border-[var(--border)] px-[30px] pt-[22px] pb-10 font-mono text-[11px] text-[var(--faint)]">
        © 2026 CollabAI · Your documents are never used to train models
      </div>
    </footer>
  );
}
