import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HexagonIcon } from "@/components/ui/icons";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header
      data-screen-label="Nav"
      className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(250,250,251,.72)] backdrop-blur-[14px]"
    >
      <div className="mx-auto flex h-[66px] max-w-[1180px] items-center justify-between gap-6 px-[30px]">
        <Link href="#top" className="flex items-center gap-[10px] text-[var(--text)]">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[image:var(--grad)] shadow-[var(--sh-accent)]">
            <HexagonIcon size={16} stroke="#fff" />
          </span>
          <span className="text-[17px] font-extrabold tracking-[-.02em]">CollabAI</span>
        </Link>

        <nav className="hidden items-center gap-[30px] md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-[14px]">
          <Link href="/login" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]">
            Log in
          </Link>
          <Button href="/register" size="sm">
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}
