import Link from "next/link";
import type { ReactNode } from "react";
import { HexagonIcon } from "@/components/ui/icons";
import { AuthVisual } from "@/components/auth/AuthVisual";

export function AuthShell({
  eyebrow,
  headline,
  subhead,
  children,
}: {
  eyebrow: string;
  headline: string;
  subhead: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[var(--bg)]">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-[30px] py-6">
        <Link href="/" className="flex items-center gap-[10px] text-[var(--text)]">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[image:var(--grad)] shadow-[var(--sh-accent)]">
            <HexagonIcon size={16} stroke="#fff" />
          </span>
          <span className="text-[17px] font-extrabold tracking-[-.02em]">CollabAI</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]">
          ← Back to home
        </Link>
      </header>

      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 px-[30px] pt-6 pb-20 lg:grid-cols-2 lg:gap-[54px] lg:pt-2">
        <AuthVisual eyebrow={eyebrow} headline={headline} subhead={subhead} />
        <div className="flex items-center justify-center py-6 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
