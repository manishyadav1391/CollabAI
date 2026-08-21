"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

export function AskComposer({ disabled, onAsk }: { disabled: boolean; onAsk: (question: string) => void }) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const question = value.trim();
    if (!question || disabled) return;
    onAsk(question);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-[100px] border border-[var(--border)] bg-white p-[7px] shadow-[var(--sh-1)]"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask a question about this project's documents…"
        className="flex-1 border-0 bg-transparent px-4 font-sans text-[14.5px] text-[var(--text)] outline-none placeholder:text-[var(--faint)]"
      />
      <Button type="submit" size="sm" disabled={disabled || !value.trim()} className="rounded-[100px] px-5 py-[10px]">
        {disabled ? "Thinking…" : "Ask"}
      </Button>
    </form>
  );
}
