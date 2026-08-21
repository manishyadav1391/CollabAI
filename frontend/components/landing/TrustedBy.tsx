import { logos } from "@/components/landing/data";

export function TrustedBy() {
  const track = [...logos, ...logos];

  return (
    <section
      data-screen-label="Trusted by"
      className="relative z-[1] mx-auto max-w-[1180px] px-[30px] pt-16"
    >
      <div className="text-center font-mono text-[11px] font-bold tracking-[.06em] text-[var(--faint)]">
        BUILT FOR MODERN TEAMS · POWERED BY A STACK YOU TRUST
      </div>
      <div
        className="mt-[26px] overflow-hidden"
        style={{
          WebkitMaskImage: "linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)",
          maskImage: "linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)",
        }}
      >
        <div className="marquee-track flex w-max">
          {track.map((logo, i) => (
            <div
              key={`${logo}-${i}`}
              className="px-[34px] text-[19px] font-bold tracking-[-.02em] whitespace-nowrap text-[#a6a6b4]"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
