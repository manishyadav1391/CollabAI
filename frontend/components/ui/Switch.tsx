"use client";

import { useState } from "react";

export function Switch({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className="box-border flex h-6 w-[42px] shrink-0 items-center rounded-[100px] p-[3px] transition-[background] duration-300"
      style={{ justifyContent: on ? "flex-end" : "flex-start", background: on ? "var(--grad)" : "var(--panel-3)" }}
    >
      <span className="h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(18,18,40,.3)] transition-all duration-300 ease-[var(--ease-out)]" />
    </button>
  );
}
