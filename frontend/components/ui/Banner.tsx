export function Banner({ children }: { children: string }) {
  return (
    <div className="rounded-[12px] bg-[var(--red-bg)] px-4 py-3 text-[13.5px] leading-[1.5] text-[var(--red)]">
      {children}
    </div>
  );
}
