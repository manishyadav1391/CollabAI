"use client";

import { useEffect } from "react";

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2" style={{ animation: "om-rise .3s cubic-bezier(.2,.7,.2,1) both" }}>
      <div className="flex items-center gap-[10px] rounded-[100px] border border-[var(--border-2)] bg-[var(--text)] px-5 py-[11px] text-[13.5px] font-medium text-white shadow-[var(--sh-2)]">
        <span className="h-[7px] w-[7px] rounded-full bg-[#34d399]" />
        {message}
      </div>
    </div>
  );
}
