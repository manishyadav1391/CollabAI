import { Reveal } from "@/components/ui/Reveal";
import { permissions, threadMessages } from "@/components/landing/data";

const checkClass = "flex items-center gap-[10px] text-[14.5px]";
const check = <span className="font-bold text-[var(--green)]">✓</span>;

const chip = (ok: boolean) => ({
  background: ok ? "var(--green-bg)" : "var(--red-bg)",
  color: ok ? "var(--green)" : "var(--red)",
});

export function DeepDive() {
  return (
    <section data-screen-label="Deep dive" className="relative z-[1] mx-auto flex max-w-[1180px] flex-col gap-[80px] px-[30px] pt-[120px] lg:gap-[110px]">
      {/* 01 · Trust */}
      <Reveal className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-[70px]">
        <div>
          <div className="font-mono text-[11px] font-bold tracking-[.06em] text-[var(--accent-soft)]">
            01 · TRUST
          </div>
          <h3 className="mt-[14px] text-[26px] leading-[1.15] font-extrabold tracking-[-.03em] sm:text-[34px]">
            Never wonder whether the AI made it up.
          </h3>
          <p className="mt-4 text-[16.5px] leading-[1.65] text-[var(--muted)]">
            Every answer is assembled from passages CollabAI can point at. Hover a citation to
            see the exact quote; click it to land on the page. If the documents don&apos;t
            support an answer, CollabAI says so instead of guessing.
          </p>
          <div className="mt-[22px] flex flex-col gap-[10px]">
            <div className={checkClass}>{check} Page-and-paragraph level citations</div>
            <div className={checkClass}>{check} Confidence signal on every response</div>
            <div className={checkClass}>{check} &quot;Not in your documents&quot; instead of a guess</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[var(--sh-2)]">
          <div className="border-b border-[var(--border)] bg-[var(--panel-2)] px-[18px] py-[14px] font-mono text-[11px] font-bold tracking-[.05em] text-[var(--faint)]">
            ANSWER · 3 CITATIONS
          </div>
          <div className="flex flex-col gap-[14px] p-5">
            <div className="text-[14.5px] leading-[1.7]">
              The uplift cap fell from 7% to{" "}
              <span className="rounded-[3px] border-b-2 border-[var(--accent)] bg-[rgba(124,108,255,.16)] px-[3px] py-px">
                4%
              </span>
              <sup className="font-mono text-[10px] font-bold text-[var(--accent-soft)]">[2]</sup> and
              applies to the renewal term only.
            </div>
            <div className="rounded-[12px] border border-[var(--border-2)] p-[12px_14px] shadow-[var(--sh-1)]">
              <div className="font-mono text-[10px] font-bold tracking-[.05em] text-[var(--faint)]">
                Q4-MSA.PDF · PAGE 14 · §7.1
              </div>
              <div className="mt-[6px] border-l-2 border-[var(--accent)] pl-[10px] text-[12.5px] leading-[1.55] text-[var(--muted)]">
                &quot;…annual uplift shall not exceed four percent (4%)…&quot;
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-[100px] bg-[var(--green-bg)] px-[10px] py-[5px] font-mono text-[10px] font-bold tracking-[.05em] text-[var(--green)]">
                HIGH CONFIDENCE
              </span>
              <span className="rounded-[100px] bg-[var(--bg-2)] px-[10px] py-[5px] font-mono text-[10px] font-bold tracking-[.05em] text-[var(--muted)]">
                3 PASSAGES
              </span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* 02 · Control */}
      <Reveal className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-[70px]">
        <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[var(--sh-2)] lg:order-1">
          <div className="border-b border-[var(--border)] bg-[var(--panel-2)] px-[18px] py-[14px] font-mono text-[11px] font-bold tracking-[.05em] text-[var(--faint)]">
            PERMISSIONS · ACME WORKSPACE
          </div>
          <div className="py-2">
            {permissions.map((p) => (
              <div
                key={p.doc}
                className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-[13px]"
              >
                <div className="flex min-w-0 items-center gap-[11px]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--bg-2)] font-mono text-[10px] font-bold text-[var(--muted)]">
                    PDF
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold">
                    {p.doc}
                  </span>
                </div>
                <span
                  className="rounded-[100px] px-[10px] py-[5px] font-mono text-[10px] font-bold tracking-[.05em] whitespace-nowrap"
                  style={chip(p.ok)}
                >
                  {p.scope}
                </span>
              </div>
            ))}
            <div className="px-5 py-[14px] text-[12.5px] text-[var(--faint)]">
              Ask as <span className="font-semibold text-[var(--muted)]">Dev (Engineering)</span> → the
              AI retrieves from 2 of 4 documents.
            </div>
          </div>
        </div>
        <div>
          <div className="font-mono text-[11px] font-bold tracking-[.06em] text-[var(--accent-soft)]">
            02 · CONTROL
          </div>
          <h3 className="mt-[14px] text-[26px] leading-[1.15] font-extrabold tracking-[-.03em] sm:text-[34px]">
            The AI only knows what you&apos;re cleared to see.
          </h3>
          <p className="mt-4 text-[16.5px] leading-[1.65] text-[var(--muted)]">
            Permissions are enforced at retrieval, not at display. A restricted contract simply
            isn&apos;t in the context window for someone outside the group — so it can&apos;t leak
            through a clever prompt.
          </p>
          <div className="mt-[22px] flex flex-col gap-[10px]">
            <div className={checkClass}>{check} Workspace, group, and per-document scopes</div>
            <div className={checkClass}>{check} Retrieval-time filtering, not post-hoc redaction</div>
            <div className={checkClass}>{check} Full audit trail of every query and source</div>
          </div>
        </div>
      </Reveal>

      {/* 03 · Together */}
      <Reveal className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-[70px]">
        <div>
          <div className="font-mono text-[11px] font-bold tracking-[.06em] text-[var(--accent-soft)]">
            03 · TOGETHER
          </div>
          <h3 className="mt-[14px] text-[26px] leading-[1.15] font-extrabold tracking-[-.03em] sm:text-[34px]">
            Conversation and documents in the same room.
          </h3>
          <p className="mt-4 text-[16.5px] leading-[1.65] text-[var(--muted)]">
            Threaded comments anchor to a passage. Team chat sits beside the doc. Share an AI
            answer into the thread and everyone sees the same sources — no screenshots pasted
            into another tool.
          </p>
          <div className="mt-[22px] flex flex-col gap-[10px]">
            <div className={checkClass}>{check} Threaded comments pinned to passages</div>
            <div className={checkClass}>{check} Live presence and typing indicators</div>
            <div className={checkClass}>{check} Share an answer, sources travel with it</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[var(--sh-2)]">
          <div className="border-b border-[var(--border)] bg-[var(--panel-2)] px-[18px] py-[14px] font-mono text-[11px] font-bold tracking-[.05em] text-[var(--faint)]">
            THREAD · §7.1 UPLIFT CAP
          </div>
          <div className="flex flex-col gap-4 p-[18px_20px]">
            {threadMessages.map((m) => (
              <div key={m.name} className="flex items-start gap-[11px]">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
                  style={{ background: m.gradient }}
                >
                  {m.initials}
                </span>
                <div>
                  <div className="text-[12.5px] font-bold">
                    {m.name}{" "}
                    <span className="font-mono text-[10.5px] font-normal text-[var(--faint)]">{m.time}</span>
                  </div>
                  <div className="mt-[3px] text-sm leading-[1.55] text-[var(--muted)]">{m.text}</div>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-[10px] rounded-[12px] border border-[var(--border)] bg-[var(--panel-2)] p-[11px_14px] text-[13px] text-[var(--faint)]">
              Reply to the thread…
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
