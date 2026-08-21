export function Eyebrow({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div
      className={`font-mono text-[11px] font-bold tracking-[.06em] text-[var(--accent-soft)] ${className}`}
    >
      {children}
    </div>
  );
}
