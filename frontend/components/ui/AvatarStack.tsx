import type { Member } from "@/lib/types";
import { avatarGradient, initials } from "@/lib/format";

export function AvatarStack({
  members,
  max = 4,
  size = 26,
}: {
  members: Member[];
  max?: number;
  size?: number;
}) {
  if (members.length === 0) return null;
  const shown = members.slice(0, max);
  const overflow = members.length - shown.length;

  return (
    <div className="flex">
      {shown.map((m, i) => (
        <span
          key={m.user_id}
          className="flex shrink-0 items-center justify-center rounded-full border-2 border-white font-bold text-white"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.38,
            background: avatarGradient(m.user_id),
            marginLeft: i === 0 ? 0 : -Math.round(size * 0.3),
          }}
          title={m.name}
        >
          {initials(m.name)}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-[var(--panel-3)] font-bold text-[var(--muted)]"
          style={{ width: size, height: size, fontSize: size * 0.34, marginLeft: -Math.round(size * 0.3) }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
