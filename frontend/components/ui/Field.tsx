import type { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-[13.5px] font-semibold text-[var(--text)]">
      {label}
      {children}
    </label>
  );
}
