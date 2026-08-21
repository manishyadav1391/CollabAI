import { Reveal } from "@/components/ui/Reveal";
import { SparkleIcon } from "@/components/ui/icons";
import { EmailCaptureForm } from "@/components/landing/EmailCaptureForm";
import { chatMessages, navDocs } from "@/components/landing/data";

export function Hero() {
  return (
    <section
      id="top"
      data-screen-label="Hero"
      className="relative z-[1] mx-auto max-w-[1180px] px-[30px] pt-[86px] text-center"
    >
      <div className="rise inline-flex items-center gap-[10px] rounded-[100px] border border-[var(--border)] bg-white py-[7px] pr-2 pl-[14px] text-[13px] text-[var(--muted)] shadow-[var(--sh-1)]">
        <span className="h-[6px] w-[6px] animate-[om-pulse_2.4s_ease-in-out_infinite] rounded-full bg-[#34d399]" />
        <span className="font-semibold text-[var(--text)]">CollabAI v1.0 is live</span>
        <span className="text-[var(--faint)]">·</span>
        <span>Citations, permissions, real-time chat</span>
        <span className="rounded-[100px] bg-[var(--bg-2)] px-[10px] py-1 font-mono text-[11px] font-bold text-[var(--accent-soft)]">
          NEW →
        </span>
      </div>

      <h1
        className="rise mx-auto mt-[26px] max-w-[940px] text-[42px] leading-[1.08] font-extrabold tracking-[-.03em] text-balance sm:text-[52px] lg:text-[66px] lg:leading-[1.03] lg:tracking-[-.036em]"
        style={{ animationDelay: "0s" }}
      >
        Your team&apos;s documents,
        <br />
        finally able to <span className="grad-text">speak for themselves</span>
      </h1>

      <p
        className="rise mx-auto mt-[26px] max-w-[640px] text-[19px] leading-[1.6] text-[var(--muted)] text-pretty"
        style={{ animationDelay: ".06s" }}
      >
        A secure, AI-powered workspace where your team chats, collaborates, and pulls answers
        straight out of your PDFs — every claim backed by a pinpoint citation.
      </p>

      <div className="rise mt-[34px] flex justify-center" style={{ animationDelay: ".12s" }}>
        <EmailCaptureForm />
      </div>
      <div className="mt-[14px] text-[13px] text-[var(--faint)]">
        Free forever tier · No credit card · SOC 2 aligned
      </div>

      <Reveal className="relative mx-auto mt-16 max-w-[1080px]">
        <div
          className="absolute inset-[6%_8%_-6%_8%] rounded-[40px] opacity-[.34] blur-[70px]"
          style={{ background: "var(--grad)" }}
        />
        <div className="relative overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[var(--sh-2)]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--panel-2)] px-4 py-3">
            <span className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
            <span className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
            <span className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
            <span className="ml-3 font-mono text-[11px] text-[var(--faint)]">
              collabai.app/workspace/acme · Q4 Board Pack
            </span>
          </div>

          <div className="grid min-h-[430px] grid-cols-1 lg:grid-cols-[212px_1fr_300px]">
            <aside className="hidden flex-col gap-[6px] border-r border-[var(--border)] bg-[var(--panel-2)] p-[14px_14px_18px] lg:flex">
              <div className="px-2 pb-2 font-mono text-[11px] font-bold tracking-[.05em] text-[var(--faint)]">
                WORKSPACE
              </div>
              {navDocs.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-[9px] rounded-[10px] px-[10px] py-2 text-[12.5px]"
                  style={{
                    fontWeight: d.active ? 650 : 400,
                    color: d.active ? "var(--text)" : "var(--muted)",
                    background: d.active ? "#fff" : "transparent",
                    border: `1px solid ${d.active ? "var(--border)" : "transparent"}`,
                    boxShadow: d.active ? "var(--sh-1)" : "none",
                  }}
                >
                  <span
                    className="h-[6px] w-[6px] shrink-0 rounded-full"
                    style={{ background: d.active ? "var(--accent)" : "var(--border-2)" }}
                  />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">{d.name}</span>
                </div>
              ))}
              <div className="mt-auto flex items-center justify-center gap-2 rounded-[12px] border border-dashed border-[var(--border-2)] p-[10px] text-xs text-[var(--faint)]">
                + Upload document
              </div>
            </aside>

            <main className="flex flex-col gap-4 p-[22px_24px]">
              <div className="flex items-center gap-[10px]">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[8px] bg-[image:var(--grad)]">
                  <SparkleIcon size={14} stroke="#fff" strokeWidth={2.2} />
                </span>
                <span className="text-sm font-bold">Ask CollabAI</span>
                <span className="ml-auto rounded-[100px] bg-[var(--green-bg)] px-[9px] py-1 font-mono text-[10px] font-bold tracking-[.05em] text-[var(--green)]">
                  4 SOURCES
                </span>
              </div>

              <div className="self-end max-w-[78%] rounded-[14px_14px_4px_14px] px-4 py-3 text-sm leading-[1.5] text-white shadow-[var(--sh-accent)] bg-[image:var(--grad)]">
                What changed in our renewal terms between the Q3 and Q4 contracts?
              </div>

              <div className="max-w-[88%] rounded-[14px_14px_14px_4px] border border-[var(--border)] bg-[var(--panel-2)] px-4 py-[14px] text-sm leading-[1.65] text-[var(--text)]">
                Three terms moved. Auto-renewal shortened from 60 to 30 days
                <sup className="font-mono text-[10px] font-bold text-[var(--accent-soft)]">[1]</sup>, the
                uplift cap dropped to 4%
                <sup className="font-mono text-[10px] font-bold text-[var(--accent-soft)]">[2]</sup>, and
                termination for convenience is now mutual
                <sup className="font-mono text-[10px] font-bold text-[var(--accent-soft)]">[3]</sup>.
              </div>

              <div className="ml-[34px] max-w-[300px] rounded-[12px] border border-[var(--border-2)] bg-white p-[12px_14px] shadow-[var(--sh-2)]">
                <div className="font-mono text-[10px] font-bold tracking-[.05em] text-[var(--faint)]">
                  CITATION [2] · PAGE 14
                </div>
                <div className="mt-2 border-l-2 border-[var(--accent)] pl-[10px] text-[12.5px] leading-[1.55] text-[var(--muted)]">
                  &quot;…annual uplift shall not exceed four percent (4%) of the then-current fee.&quot;
                </div>
                <div className="mt-[10px] text-xs font-semibold text-[var(--accent-soft)]">
                  Open in Q4-MSA.pdf →
                </div>
              </div>
            </main>

            <aside className="hidden flex-col gap-[14px] border-l border-[var(--border)] p-[18px_16px] lg:flex">
              <div className="font-mono text-[11px] font-bold tracking-[.05em] text-[var(--faint)]">
                TEAM CHAT
              </div>
              {chatMessages.map((m) => (
                <div key={m.name} className="flex items-start gap-[10px]">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
                    style={{ background: m.gradient }}
                  >
                    {m.initials}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold">{m.name}</div>
                    <div className="text-[12.5px] leading-[1.5] text-[var(--muted)]">{m.text}</div>
                  </div>
                </div>
              ))}
              <div className="mt-auto flex items-center gap-2 text-xs text-[var(--faint)]">
                <span className="inline-flex gap-[3px]">
                  <span className="h-[5px] w-[5px] animate-[om-pulse_1.2s_ease-in-out_infinite] rounded-full bg-[var(--accent)]" />
                  <span
                    className="h-[5px] w-[5px] animate-[om-pulse_1.2s_ease-in-out_infinite] rounded-full bg-[var(--accent)]"
                    style={{ animationDelay: ".2s" }}
                  />
                  <span
                    className="h-[5px] w-[5px] animate-[om-pulse_1.2s_ease-in-out_infinite] rounded-full bg-[var(--accent)]"
                    style={{ animationDelay: ".4s" }}
                  />
                </span>
                Priya is typing…
              </div>
            </aside>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
