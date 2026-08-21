"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { proFeatures, starterFeatures } from "@/components/landing/data";

function billBtnClass(active: boolean) {
  return `inline-flex items-center gap-[6px] rounded-[100px] border-0 px-[18px] py-[9px] font-sans text-[13.5px] font-semibold transition-all duration-[.25s] ${
    active ? "text-white bg-[image:var(--grad)] shadow-[0_8px_20px_-12px_rgba(124,108,255,.9)]" : "text-[var(--muted)]"
  }`;
}

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" data-screen-label="Pricing" className="relative z-[1] mx-auto max-w-[1180px] px-[30px] pt-[120px]">
      <Reveal className="mx-auto max-w-[620px] text-center">
        <Eyebrow>PRICING</Eyebrow>
        <h2 className="mt-[14px] text-[32px] leading-[1.1] font-extrabold tracking-[-.03em] sm:text-[44px]">
          Simple, and the numbers are on the page.
        </h2>
        <div className="mx-auto mt-7 inline-flex gap-1 rounded-[100px] border border-[var(--border)] bg-[var(--panel-2)] p-[5px]">
          <button type="button" onClick={() => setAnnual(false)} className={billBtnClass(!annual)}>
            Monthly
          </button>
          <button type="button" onClick={() => setAnnual(true)} className={billBtnClass(annual)}>
            Annual <span className="font-mono text-[10px]">−20%</span>
          </button>
        </div>
      </Reveal>

      <Reveal className="mx-auto mt-11 grid max-w-[880px] grid-cols-1 items-start gap-[22px] sm:grid-cols-2">
        <div className="flex flex-col gap-[22px] rounded-[18px] border border-[var(--border)] bg-white p-[30px] shadow-[var(--sh-1)]">
          <div>
            <div className="text-[15px] font-bold">Starter</div>
            <div className="mt-1 text-[13.5px] text-[var(--muted)]">
              Everything you need to prove it works.
            </div>
          </div>
          <div className="flex items-baseline gap-[6px]">
            <span className="text-[48px] font-extrabold tracking-[-.04em]">$0</span>
            <span className="text-sm text-[var(--faint)]">forever</span>
          </div>
          <Button href="/register" variant="secondary" className="w-full">
            Start for free
          </Button>
          <div className="flex flex-col gap-[11px]">
            {starterFeatures.map((f) => (
              <div key={f} className="flex items-start gap-[10px] text-sm leading-[1.5] text-[var(--muted)]">
                <span className="font-bold text-[var(--green)]">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-[18px] p-[1.5px] shadow-[0_24px_60px_-30px_rgba(124,108,255,.75)] bg-[image:var(--grad)]">
          <div className="flex flex-col gap-[22px] rounded-[17px] bg-white p-[30px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[15px] font-bold">Pro</div>
                <div className="mt-1 text-[13.5px] text-[var(--muted)]">
                  For teams who live in their documents.
                </div>
              </div>
              <span className="rounded-[100px] px-[10px] py-[5px] font-mono text-[10px] font-bold tracking-[.05em] whitespace-nowrap text-white bg-[image:var(--grad)]">
                POPULAR
              </span>
            </div>
            <div className="flex items-baseline gap-[6px]">
              <span className="text-[48px] font-extrabold tracking-[-.04em]">{annual ? "$19" : "$24"}</span>
              <span className="text-sm text-[var(--faint)]">
                {annual ? "/user/mo, billed annually" : "/user/mo"}
              </span>
            </div>
            <Button href="/register" className="w-full">
              Get started
            </Button>
            <div className="flex flex-col gap-[11px]">
              {proFeatures.map((f) => (
                <div key={f} className="flex items-start gap-[10px] text-sm leading-[1.5] text-[var(--muted)]">
                  <span className="font-bold text-[var(--green)]">✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
      <div className="mt-5 text-center text-[13px] text-[var(--faint)]">
        Need SSO, on-prem, or a bigger seat count? <a href="#top">Talk to us →</a>
      </div>
    </section>
  );
}
