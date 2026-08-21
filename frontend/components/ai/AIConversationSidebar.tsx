import type { AIConversationSummary } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";

export function AIConversationSidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNewChat,
}: {
  conversations: AIConversationSummary[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}) {
  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-[var(--border)] bg-white">
      <div className="shrink-0 p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-[6px] rounded-[12px] border border-[var(--border)] bg-white px-3 py-[10px] text-[13px] font-bold text-[var(--text)] transition-colors hover:bg-[var(--panel-2)]"
        >
          <span className="text-[15px] leading-none">+</span>
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <div className="px-3 pb-1 text-[11px] font-bold tracking-[.05em] text-[var(--faint)] uppercase">History</div>

        {conversations.length === 0 ? (
          <p className="px-3 py-2 text-[12.5px] text-[var(--faint)]">No conversations yet.</p>
        ) : (
          <div className="flex flex-col gap-[2px]">
            {conversations.map((c) => {
              const active = c.id === activeConversationId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={`w-full rounded-[12px] px-3 py-[9px] text-left transition-colors duration-150 ${
                    active ? "bg-[var(--panel-2)]" : "hover:bg-[var(--panel-2)]"
                  }`}
                >
                  <div className="truncate text-[13px] font-semibold text-[var(--text)]">{c.title}</div>
                  <div className="mt-[2px] font-mono text-[10.5px] text-[var(--faint)]">
                    {formatRelativeTime(c.updated_at)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
