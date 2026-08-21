import { GridIcon, ListIcon } from "@/components/dashboard/icons";

export type ViewMode = "grid" | "list";

export function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const options: { key: ViewMode; icon: typeof GridIcon; label: string }[] = [
    { key: "grid", icon: GridIcon, label: "Grid view" },
    { key: "list", icon: ListIcon, label: "List view" },
  ];

  return (
    <div className="inline-flex gap-[2px] rounded-[10px] border border-[var(--border)] bg-[var(--panel-2)] p-[3px]">
      {options.map((opt) => {
        const active = view === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            aria-label={opt.label}
            aria-pressed={active}
            onClick={() => onChange(opt.key)}
            className="flex h-[30px] w-[34px] items-center justify-center rounded-[7px] transition-colors"
            style={{
              background: active ? "#fff" : "transparent",
              color: active ? "var(--text)" : "var(--faint)",
              boxShadow: active ? "var(--sh-1)" : "none",
            }}
          >
            <opt.icon size={15} />
          </button>
        );
      })}
    </div>
  );
}
