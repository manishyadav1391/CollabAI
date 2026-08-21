import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function CTA() {
  return (
    <section data-screen-label="Bottom CTA" className="relative z-[1] mx-auto max-w-[1180px] px-[30px] pt-[120px]">
      <Reveal className="relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-white p-[78px_30px] text-center shadow-[var(--sh-2)]">
        <div
          className="pointer-events-none absolute -inset-x-[10%] -top-[40%] h-[520px] blur-[50px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(124,108,255,.30), rgba(34,211,238,.14) 45%, transparent 72%)",
          }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-[680px] text-[32px] leading-[1.12] font-extrabold tracking-[-.03em] text-balance sm:text-[46px] sm:leading-[1.08]">
            Ready to give your team a smarter workspace?
          </h2>
          <p className="mx-auto mt-[18px] max-w-[520px] text-[17px] leading-[1.6] text-[var(--muted)]">
            Upload your first document in under a minute. Free forever for small teams.
          </p>
          <div className="mt-[30px] flex flex-wrap justify-center gap-3">
            <Button href="/register">Get started free</Button>
            <Button href="mailto:hello@collabai.app" variant="secondary">
              Book a demo
            </Button>
          </div>
          <div className="mt-4 font-mono text-[11px] tracking-[.05em] text-[var(--faint)]">
            NO CREDIT CARD · YOUR DOCUMENTS ARE NEVER USED FOR TRAINING
          </div>
        </div>
      </Reveal>
    </section>
  );
}
