import { GlobeIcon, LockIcon } from "@/components/dashboard/icons";

export function AccessIndicator({ visibility, size = "md" }: { visibility: string; size?: "sm" | "md" }) {
  const restricted = visibility !== "workspace_wide";
  const iconSize = size === "sm" ? 12.5 : 14;

  if (restricted) {
    return (
      <span className="inline-flex items-center gap-[6px] rounded-[100px] bg-[var(--red-bg)] px-[9px] py-[3px] text-[12px] font-semibold text-[var(--red)]">
        <LockIcon size={iconSize} strokeWidth={2.3} />
        Restricted access
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-[6px] text-[12px] text-[var(--muted)]">
      <GlobeIcon size={iconSize} stroke="var(--faint)" />
      Workspace access
    </span>
  );
}
