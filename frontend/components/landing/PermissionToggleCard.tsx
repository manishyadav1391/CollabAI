"use client";

import { useState } from "react";

export function PermissionToggleCard() {
  const [restricted, setRestricted] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setRestricted((v) => !v)}
      className="mt-auto flex items-center justify-between gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--panel-2)] p-[14px] text-left"
    >
      <div>
        <div className="text-[13px] font-semibold">
          {restricted ? "Restricted · 4 people" : "Workspace-wide"}
        </div>
        <div className="mt-[3px] font-mono text-[10px] tracking-[.05em] text-[var(--faint)]">
          BOARD-MINUTES.PDF
        </div>
      </div>
      <span
        className="box-border flex h-6 w-[42px] shrink-0 items-center rounded-[100px] p-[3px] transition-[background] duration-300"
        style={{
          justifyContent: restricted ? "flex-end" : "flex-start",
          background: restricted ? "var(--grad)" : "var(--panel-3)",
        }}
      >
        <span className="h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(18,18,40,.3)] transition-all duration-300 ease-[var(--ease-out)]" />
      </span>
    </button>
  );
}
