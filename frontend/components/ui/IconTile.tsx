import type { ReactNode } from "react";

const sizes = {
  sm: { box: 26, radius: 8 },
  md: { box: 30, radius: 9 },
  lg: { box: 38, radius: 11 },
};

export function IconTile({
  children,
  size = "lg",
  className = "",
}: {
  children: ReactNode;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const { box, radius } = sizes[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-white shadow-[var(--sh-accent)] bg-[image:var(--grad)] ${className}`}
      style={{ width: box, height: box, borderRadius: radius }}
    >
      {children}
    </span>
  );
}
