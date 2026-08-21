"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ChevronDownIcon } from "@/components/ui/icons";
import { faqs } from "@/components/landing/data";

export function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" data-screen-label="FAQ" className="relative z-[1] mx-auto max-w-[880px] px-[30px] pt-[120px]">
      <Reveal className="text-center">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-[14px] text-[32px] leading-[1.1] font-extrabold tracking-[-.03em] sm:text-[44px]">
          The questions everyone asks first.
        </h2>
      </Reveal>

      <Reveal className="mt-10 flex flex-col gap-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className="overflow-hidden rounded-[14px] border bg-white transition-[box-shadow,border-color] duration-300"
              style={{
                borderColor: isOpen ? "var(--border-2)" : "var(--border)",
                boxShadow: isOpen ? "var(--sh-2)" : "var(--sh-1)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-5 px-[22px] py-5 text-left font-sans"
              >
                <span className="text-base font-semibold tracking-[-.01em] text-[var(--text)]">{f.q}</span>
                <span
                  className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] transition-[transform,background] duration-[.35s] ease-[var(--ease-out)]"
                  style={{
                    background: isOpen ? "var(--grad)" : "var(--panel-2)",
                    color: isOpen ? "#fff" : "var(--muted)",
                    transform: isOpen ? "rotate(180deg)" : "none",
                  }}
                >
                  <ChevronDownIcon size={14} />
                </span>
              </button>
              <div
                className="overflow-hidden transition-[max-height,opacity] duration-[.4s] ease-[var(--ease-out)]"
                style={{ maxHeight: isOpen ? 220 : 0, opacity: isOpen ? 1 : 0 }}
              >
                <div className="max-w-[96%] px-[22px] pb-[22px] text-[15px] leading-[1.7] text-[var(--muted)]">
                  {f.a}
                </div>
              </div>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
