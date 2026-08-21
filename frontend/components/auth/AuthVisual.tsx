const squares: { top: string; left: string; size: number; delay: string; duration: string; drift: "a" | "b" }[] = [
  { top: "12%", left: "68%", size: 46, delay: "0s", duration: "16s", drift: "a" },
  { top: "24%", left: "14%", size: 30, delay: "1.2s", duration: "20s", drift: "b" },
  { top: "48%", left: "78%", size: 64, delay: "2.4s", duration: "22s", drift: "a" },
  { top: "62%", left: "22%", size: 40, delay: "0.6s", duration: "18s", drift: "b" },
  { top: "78%", left: "58%", size: 26, delay: "3s", duration: "15s", drift: "a" },
  { top: "8%", left: "40%", size: 22, delay: "1.8s", duration: "24s", drift: "b" },
];

const checklist = [
  "Every answer backed by a pinpoint citation",
  "Permissions enforced at retrieval, not display",
  "Your documents are never used for training",
];

export function AuthVisual({
  eyebrow,
  headline,
  subhead,
}: {
  eyebrow: string;
  headline: string;
  subhead: string;
}) {
  return (
    <div className="relative hidden overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-2)] lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(18,18,40,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(18,18,40,.06) 1px,transparent 1px)",
            backgroundSize: "52px 52px",
            animation: "om-grid-pan 14s linear infinite",
            WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 40%,#000,transparent 78%)",
            maskImage: "radial-gradient(ellipse 75% 65% at 50% 40%,#000,transparent 78%)",
          }}
        />
        <div
          className="absolute -top-[120px] -left-[80px] h-[380px] w-[380px] rounded-full blur-[90px]"
          style={{
            background: "radial-gradient(circle, rgba(124,108,255,.30), transparent 68%)",
            animation: "om-float-a 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-[100px] -bottom-[100px] h-[360px] w-[360px] rounded-full blur-[90px]"
          style={{
            background: "radial-gradient(circle, rgba(34,211,238,.26), transparent 68%)",
            animation: "om-float-b 24s ease-in-out infinite",
          }}
        />
        {squares.map((s, i) => (
          <span
            key={i}
            className="absolute border-[1.5px] border-[rgba(124,108,255,.32)] bg-white/40 backdrop-blur-[1px]"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: s.size > 40 ? 16 : 10,
              animation: `om-square-drift-${s.drift} ${s.duration} ease-in-out infinite`,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-[1] flex flex-1 flex-col justify-center gap-6 p-[52px]">
        <div className="font-mono text-[11px] font-bold tracking-[.06em] text-[var(--accent-soft)]">
          {eyebrow}
        </div>
        <h2 className="max-w-[380px] text-[34px] leading-[1.15] font-extrabold tracking-[-.03em] text-[var(--text)]">
          {headline}
        </h2>
        <p className="max-w-[340px] text-[15.5px] leading-[1.6] text-[var(--muted)]">{subhead}</p>
        <div className="mt-4 flex flex-col gap-[10px]">
          {checklist.map((item) => (
            <div key={item} className="flex items-center gap-[10px] text-[14px] text-[var(--muted)]">
              <span className="font-bold text-[var(--green)]">✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
