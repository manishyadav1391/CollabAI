import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-[7px] rounded-[var(--r)] font-semibold font-sans leading-none whitespace-nowrap cursor-pointer transition-[transform,box-shadow,border-color,background] duration-150 ease-[var(--ease-out)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0";

const sizes: Record<Size, string> = {
  md: "px-6 py-[13px] text-[15px]",
  sm: "px-[15px] py-[9px] text-[13px]",
};

const variants: Record<Variant, string> = {
  primary:
    "border-0 text-white bg-[image:var(--grad)] shadow-[var(--sh-accent)] hover:shadow-[0_12px_28px_-12px_rgba(124,108,255,.8)]",
  secondary:
    "border border-[var(--border)] bg-[var(--panel-2)] text-[var(--text)] hover:border-[var(--border-2)] hover:bg-[var(--panel-3)]",
  ghost: "border border-[var(--border-2)] bg-white/40 text-[var(--text)] hover:border-[var(--accent)]",
  danger: "border-0 text-[var(--red)] bg-[var(--red-bg)] hover:bg-[rgba(251,113,133,.24)]",
};

function classesFor(variant: Variant, size: Size, className: string) {
  return `${base} ${sizes[size]} ${variants[variant]} ${className}`;
}

type StyleProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = StyleProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { href?: undefined };

type ButtonAsLink = StyleProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className"> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className = "", children } = props;
  const classes = classesFor(variant, size, className);

  if (props.href) {
    const { href, target, rel, onClick } = props as ButtonAsLink;
    return (
      <Link href={href} target={target} rel={rel} onClick={onClick} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = "button", disabled, onClick, name, value, form } = props as ButtonAsButton;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      name={name}
      value={value}
      form={form}
      className={classes}
    >
      {children}
    </button>
  );
}
