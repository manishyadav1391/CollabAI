import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LiveDemo } from "@/components/landing/LiveDemo";

export function HowItWorks() {
  return (
    <section id="how" data-screen-label="Aha moment" className="relative z-[1] mx-auto max-w-[1180px] px-[30px] pt-[110px]">
      <Reveal className="mx-auto max-w-[640px] text-center">
        <Eyebrow>THE AHA MOMENT</Eyebrow>
        <h2 className="mt-[14px] text-[32px] leading-[1.1] font-extrabold tracking-[-.03em] sm:text-[44px]">
          Drop a PDF. Ask a hard question. Get a cited answer.
        </h2>
        <p className="mt-4 text-[17px] leading-[1.6] text-[var(--muted)]">
          Fifteen seconds, start to finish. Watch it happen.
        </p>
      </Reveal>

      <Reveal>
        <LiveDemo />
      </Reveal>
    </section>
  );
}
