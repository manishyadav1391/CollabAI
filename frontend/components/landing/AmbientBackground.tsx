export function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[1100px] overflow-hidden">
      <div
        className="absolute -top-[260px] left-[8%] h-[620px] w-[620px] rounded-full blur-[90px]"
        style={{
          background: "radial-gradient(circle, rgba(124,108,255,.34), transparent 68%)",
          animation: "om-float-a 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -top-[140px] right-[2%] h-[560px] w-[560px] rounded-full blur-[90px]"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,.28), transparent 68%)",
          animation: "om-float-b 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[180px] left-[38%] h-[420px] w-[420px] rounded-full blur-[90px]"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,.20), transparent 70%)",
          animation: "om-float-a 26s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(18,18,40,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(18,18,40,.045) 1px,transparent 1px)",
          backgroundSize: "52px 52px",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 20%,#000,transparent 75%)",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 20%,#000,transparent 75%)",
        }}
      />
    </div>
  );
}
