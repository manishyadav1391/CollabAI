import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-[var(--r)] border border-[var(--border)] bg-[var(--panel-2)] px-[14px] py-[11px] font-sans text-[14px] text-[var(--text)] outline-none transition-colors duration-150 placeholder:text-[var(--faint)] focus:border-[var(--accent)] focus:bg-white ${className}`}
    />
  );
}
