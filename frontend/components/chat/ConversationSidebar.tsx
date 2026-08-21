import type { DMThread, Member } from "@/lib/types";
import { avatarGradient, formatRelativeTime, initials } from "@/lib/format";
import { MessageIcon } from "@/components/ui/icons";

export type ActiveTarget = { kind: "room" } | { kind: "dm"; userId: string };

function targetsEqual(a: ActiveTarget, b: ActiveTarget) {
  if (a.kind !== b.kind) return false;
  return a.kind === "dm" && b.kind === "dm" ? a.userId === b.userId : true;
}

export function ConversationSidebar({
  members,
  currentUserId,
  dmThreads,
  activeTarget,
  onSelect,
}: {
  members: Member[];
  currentUserId: string | null;
  dmThreads: DMThread[];
  activeTarget: ActiveTarget;
  onSelect: (target: ActiveTarget) => void;
}) {
  const threadByUserId = new Map(dmThreads.map((t) => [t.other_user_id, t]));

  const others = members
    .filter((m) => m.user_id !== currentUserId)
    .map((m) => ({ member: m, thread: threadByUserId.get(m.user_id) ?? null }))
    .sort((a, b) => {
      if (a.thread && b.thread) {
        return (b.thread.last_message_at ?? "").localeCompare(a.thread.last_message_at ?? "");
      }
      if (a.thread) return -1;
      if (b.thread) return 1;
      return a.member.name.localeCompare(b.member.name);
    });

  const rowClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-[12px] px-3 py-[10px] text-left transition-colors duration-150 ${
      active ? "bg-[var(--panel-2)]" : "hover:bg-[var(--panel-2)]"
    }`;

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-[var(--border)] bg-white">
      <div className="shrink-0 border-b border-[var(--border)] px-4 py-4">
        <h2 className="text-[13px] font-extrabold tracking-[-.01em] text-[var(--text)]">Chat</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <button type="button" className={rowClass(activeTarget.kind === "room")} onClick={() => onSelect({ kind: "room" })}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[image:var(--grad)]">
            <MessageIcon size={16} stroke="#fff" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-bold text-[var(--text)]">Team chat</div>
            <div className="truncate text-[12px] text-[var(--faint)]">Everyone on this project</div>
          </div>
        </button>

        <div className="mt-3 px-3 text-[11px] font-bold tracking-[.05em] text-[var(--faint)] uppercase">
          Direct messages
        </div>

        <div className="mt-1 flex flex-col gap-[2px]">
          {others.length === 0 ? (
            <p className="px-3 py-2 text-[12.5px] text-[var(--faint)]">No other members yet.</p>
          ) : (
            others.map(({ member, thread }) => {
              const active = targetsEqual(activeTarget, { kind: "dm", userId: member.user_id });
              return (
                <button
                  key={member.user_id}
                  type="button"
                  className={rowClass(active)}
                  onClick={() => onSelect({ kind: "dm", userId: member.user_id })}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: avatarGradient(member.user_id) }}
                  >
                    {initials(member.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-bold text-[var(--text)]">{member.name}</span>
                      {thread?.last_message_at && (
                        <span className="shrink-0 font-mono text-[10px] text-[var(--faint)]">
                          {formatRelativeTime(thread.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[12px] text-[var(--faint)]">
                      {thread?.last_message ?? "Start a conversation"}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
