"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function EmailCaptureForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = email ? `?email=${encodeURIComponent(email)}` : "";
    router.push(`/register${params}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-[100px] border border-[var(--border)] bg-white p-[7px] shadow-[var(--sh-1)]"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="w-[250px] border-0 bg-transparent px-4 font-sans text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--faint)]"
      />
      <Button size="md" className="rounded-[100px] px-[22px] py-3">
        Start for free
      </Button>
    </form>
  );
}
