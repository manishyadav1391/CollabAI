import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IconTile } from "@/components/ui/IconTile";
import { BracketsIcon, MessageIcon, ShieldIcon, ZapIcon } from "@/components/ui/icons";
import { PermissionToggleCard } from "@/components/landing/PermissionToggleCard";

const cardClass =
  "flex flex-col gap-[18px] rounded-[18px] border border-[var(--border)] bg-white p-[26px] shadow-[var(--sh-1)] transition-[transform,box-shadow,border-color] duration-[.35s] ease-[var(--ease-out)] hover:-translate-y-[5px] hover:border-[var(--border-2)] hover:shadow-[var(--sh-2)]";

export function Features() {
  return (
    <section
      id="features"
      data-screen-label="Bento features"
      className="relative z-[1] mx-auto max-w-[1180px] px-[30px] pt-[110px]"
    >
      <Reveal className="max-w-[620px]">
        <Eyebrow>CAPABILITIES</Eyebrow>
        <h2 className="mt-[14px] text-[32px] leading-[1.1] font-extrabold tracking-[-.03em] sm:text-[44px]">
          Everything a document workspace should have done years ago.
        </h2>
      </Reveal>

      <Reveal className="mt-11 grid grid-cols-1 gap-[18px] sm:grid-cols-6">
        <div className={`sm:col-span-4 ${cardClass}`}>
          <div>
            <div className="flex items-center gap-3">
              <IconTile>
                <BracketsIcon size={19} stroke="#fff" />
              </IconTile>
              <h3 className="text-[20px] font-bold tracking-[-.02em]">
                Instant RAG answers, with receipts
              </h3>
            </div>
            <p className="mt-3 max-w-[520px] text-[15px] leading-[1.6] text-[var(--muted)]">
              Ask in plain language. Every sentence in the answer links back to the exact page
              and paragraph it came from, so nobody has to trust a hallucination.
            </p>
          </div>
          <div className="mt-auto flex flex-col gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--panel-2)] p-4">
            <div className="text-[13.5px] leading-[1.6]">
              Renewal notice window is now{" "}
              <span className="rounded-[3px] border-b-2 border-[var(--accent)] bg-[rgba(124,108,255,.16)] px-[3px] py-px">
                30 days
              </span>
              <sup className="font-mono text-[10px] font-bold text-[var(--accent-soft)]">[1]</sup>, down
              from 60.
            </div>
            <div className="max-w-[340px] self-start rounded-[10px] border border-[var(--border-2)] bg-white p-[10px_12px] shadow-[var(--sh-1)]">
              <div className="font-mono text-[10px] font-bold tracking-[.05em] text-[var(--faint)]">
                Q4-MSA.PDF · PAGE 9 · §4.2
              </div>
              <div className="mt-[6px] text-[12.5px] leading-[1.5] text-[var(--muted)]">
                &quot;Either party may give notice of non-renewal no less than thirty (30) days
                prior…&quot;
              </div>
            </div>
          </div>
        </div>

        <div className={`sm:col-span-2 ${cardClass}`}>
          <IconTile>
            <ShieldIcon size={19} stroke="#fff" />
          </IconTile>
          <div>
            <h3 className="text-[19px] font-bold tracking-[-.02em]">Bank-grade access control</h3>
            <p className="mt-[10px] text-[14.5px] leading-[1.6] text-[var(--muted)]">
              Flip a document from workspace-wide to restricted in one click. The AI only knows
              what the person asking is allowed to see.
            </p>
          </div>
          <PermissionToggleCard />
        </div>

        <div className={`sm:col-span-3 ${cardClass}`}>
          <IconTile>
            <MessageIcon size={19} stroke="#fff" />
          </IconTile>
          <div>
            <h3 className="text-[19px] font-bold tracking-[-.02em]">
              Real-time team chat, in context
            </h3>
            <p className="mt-[10px] text-[14.5px] leading-[1.6] text-[var(--muted)]">
              Threads live beside the document, not in another app. Presence, typing indicators,
              and comment threads that resolve.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-[10px]">
            <div className="flex">
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white" style={{ background: "linear-gradient(140deg,#7c6cff,#a855f7)" }}>
                PR
              </span>
              <span className="-ml-[9px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white" style={{ background: "linear-gradient(140deg,#a855f7,#22d3ee)" }}>
                DK
              </span>
              <span className="-ml-[9px] flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white" style={{ background: "linear-gradient(140deg,#22d3ee,#7c6cff)" }}>
                AM
              </span>
            </div>
            <span className="text-[12.5px] text-[var(--faint)]">3 teammates in this doc right now</span>
          </div>
        </div>

        <div className={`sm:col-span-3 ${cardClass}`}>
          <IconTile>
            <ZapIcon size={19} stroke="#fff" />
          </IconTile>
          <div>
            <h3 className="text-[19px] font-bold tracking-[-.02em]">Lightning-fast processing</h3>
            <p className="mt-[10px] text-[14.5px] leading-[1.6] text-[var(--muted)]">
              Background workers parse, chunk and embed a 200-page PDF in seconds — you keep
              working while it indexes.
            </p>
          </div>
          <div className="mt-auto flex flex-col gap-[6px] rounded-[14px] border border-[var(--border)] bg-[var(--panel-2)] p-[14px] font-mono text-[11.5px] text-[var(--muted)]">
            <div>
              <span className="text-[var(--green)]">✓</span> parsed 214 pages{" "}
              <span className="text-[var(--faint)]">1.8s</span>
            </div>
            <div>
              <span className="text-[var(--green)]">✓</span> embedded 1,042 chunks{" "}
              <span className="text-[var(--faint)]">2.4s</span>
            </div>
            <div className="mt-[2px] h-[5px] overflow-hidden rounded-[100px] bg-[var(--panel-3)]">
              <span className="block h-full w-full bg-[image:var(--grad)]" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
