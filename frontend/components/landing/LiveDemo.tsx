"use client";

import { useEffect, useRef, useState } from "react";
import { SparkleIcon, FileIcon } from "@/components/ui/icons";
import { demoAnswer, demoQuestion } from "@/components/landing/data";

const LOOP = 190;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function clampf(t: number, a: number, b: number) {
  return clamp01((t - a) / (b - a));
}

const STEP_COLORS: [string, string][] = [
  ["rgba(124,108,255,.14)", "#6152e8"],
  ["rgba(251,191,36,.18)", "#a06a00"],
  ["rgba(34,211,238,.16)", "#0b7f96"],
  ["rgba(52,211,153,.16)", "#0f9b6c"],
];

export function LiveDemo() {
  const [tick, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !timerRef.current) {
          timerRef.current = setInterval(() => setTick((t) => t + 1), 80);
        } else if (!visible && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const t = tick % LOOP;
  const dropP = clampf(t, 6, 26);
  const procP = clampf(t, 30, 66);
  const qP = clampf(t, 72, 108);
  const aP = clampf(t, 116, 168);
  const citeP = clampf(t, 160, 176);

  const stepIdx = t < 30 ? 0 : t < 70 ? 1 : t < 112 ? 2 : 3;
  const stepLabel = ["Drop a file", "Indexing", "Asking", "Answering"][stepIdx];
  const [stepBg, stepColor] = STEP_COLORS[stepIdx];

  const secs = (t * 0.08).toFixed(1);

  const questionText = demoQuestion.slice(0, Math.round(qP * demoQuestion.length));
  const answerText = demoAnswer.slice(0, Math.round(aP * demoAnswer.length));

  const procLabel = procP >= 1 ? "indexed · 1,042 chunks" : procP > 0 ? "embedding chunks…" : "waiting for file";

  return (
    <div ref={containerRef} className="relative mx-auto mt-11 max-w-[1000px]">
      <div
        className="absolute inset-[10%_10%_-4%_10%] rounded-[40px] opacity-[.26] blur-[70px]"
        style={{ background: "var(--grad)" }}
      />
      <div className="relative overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[var(--sh-2)]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--panel-2)] px-[18px] py-3">
          <span className="font-mono text-[11px] font-bold tracking-[.05em] text-[var(--faint)]">
            LIVE DEMO
          </span>
          <span
            className="rounded-[100px] px-[10px] py-1 font-mono text-[10px] font-bold tracking-[.05em] uppercase"
            style={{ background: stepBg, color: stepColor }}
          >
            {stepLabel}
          </span>
          <span className="ml-auto font-mono text-[11px] text-[var(--faint)]">{secs}s</span>
        </div>

        <div className="relative grid min-h-[392px] grid-cols-1 gap-[22px] p-[26px] md:grid-cols-[280px_1fr]">
          <div className="relative flex flex-col gap-[14px] overflow-hidden rounded-[14px] border border-dashed border-[var(--border-2)] bg-[var(--panel-2)] p-[18px]">
            <div className="font-mono text-[10px] font-bold tracking-[.05em] text-[var(--faint)]">
              DROP ZONE
            </div>
            <div
              className="flex items-center gap-[11px] rounded-[12px] border border-[var(--border)] bg-white p-3"
              style={{
                boxShadow: dropP < 1 ? "var(--sh-2)" : "var(--sh-1)",
                opacity: 0.15 + dropP * 0.85,
                transform: `translate(${(1 - dropP) * 46}px,${(1 - dropP) * -62}px) rotate(${(1 - dropP) * -7}deg) scale(${0.9 + dropP * 0.1})`,
              }}
            >
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[var(--red-bg)]">
                <FileIcon size={17} stroke="#e0475f" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold">Q4-MSA.pdf</div>
                <div className="font-mono text-[10.5px] text-[var(--faint)]">214 pages · 8.4 MB</div>
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <div className="flex justify-between font-mono text-[10.5px] text-[var(--faint)]">
                <span>{procLabel}</span>
                <span>{Math.round(procP * 100)}%</span>
              </div>
              <div className="h-[6px] overflow-hidden rounded-[100px] bg-[var(--panel-3)]">
                <span
                  className="block h-full bg-[image:var(--grad)] transition-[width] duration-100 linear"
                  style={{ width: `${procP * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[14px]">
            <div
              className="min-h-[20px] self-end max-w-[80%] rounded-[14px_14px_4px_14px] px-[17px] py-[13px] text-[14.5px] leading-[1.5] text-white shadow-[var(--sh-accent)] transition-[opacity,transform] duration-300 bg-[image:var(--grad)]"
              style={{ opacity: qP > 0 ? 1 : 0, transform: qP > 0 ? "none" : "translateY(8px)" }}
            >
              {questionText}
              <span
                className="ml-[2px] inline-block h-[14px] w-[2px] bg-white align-[-2px]"
                style={{
                  display: qP > 0 && qP < 1 ? "inline-block" : "none",
                  animation: "om-blink 1s steps(1) infinite",
                }}
              />
            </div>

            <div
              className="min-h-[150px] rounded-[14px_14px_14px_4px] border border-[var(--border)] bg-[var(--panel-2)] p-[18px] transition-[opacity,transform] duration-[.35s]"
              style={{ opacity: aP > 0 ? 1 : 0, transform: aP > 0 ? "none" : "translateY(10px)" }}
            >
              <div className="mb-[10px] flex items-center gap-[9px]">
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-[image:var(--grad)]">
                  <SparkleIcon size={12} stroke="#fff" strokeWidth={2.4} />
                </span>
                <span className="text-xs font-bold">CollabAI</span>
                <span className="font-mono text-[10px] text-[var(--faint)]">grounded in 4 passages</span>
              </div>
              <div className="text-[14.5px] leading-[1.7] text-[var(--text)]">{answerText}</div>
              <div
                className="mt-[14px] rounded-[12px] border border-[var(--border-2)] bg-white p-[12px_14px] shadow-[var(--sh-1)]"
                style={{ opacity: citeP, transform: `translateY(${(1 - citeP) * 10}px)` }}
              >
                <div className="font-mono text-[10px] font-bold tracking-[.05em] text-[var(--faint)]">
                  SOURCE [1] · Q4-MSA.PDF · PAGE 9
                </div>
                <div className="mt-[6px] border-l-2 border-[var(--accent)] pl-[10px] text-[12.5px] leading-[1.55] text-[var(--muted)]">
                  &quot;…notice of non-renewal no less than thirty (30) days prior to the end of the
                  then-current term.&quot;
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
