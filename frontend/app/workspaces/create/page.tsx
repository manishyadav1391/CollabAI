"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { HexagonIcon } from "@/components/ui/icons";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiClient.post("/workspaces", { name });
      router.push("/workspaces");
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail ?? "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-6 py-16">
      <Link href="/" className="mb-10 flex items-center gap-[10px] text-[var(--text)]">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[image:var(--grad)] shadow-[var(--sh-accent)]">
          <HexagonIcon size={16} stroke="#fff" />
        </span>
        <span className="text-[17px] font-extrabold tracking-[-.02em]">CollabAI</span>
      </Link>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[400px] rounded-[18px] border border-[var(--border)] bg-white p-[34px] shadow-[var(--sh-1)]"
      >
        <h1 className="text-[22px] font-extrabold tracking-[-.02em] text-[var(--text)]">
          Create a workspace
        </h1>
        <p className="mt-[6px] text-[13.5px] text-[var(--muted)]">
          A workspace holds your team&apos;s projects, documents, and chat.
        </p>

        <div className="mt-7 flex flex-col gap-4">
          <Field label="Workspace name">
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corporation"
              autoFocus
            />
          </Field>

          {error && <Banner>{error}</Banner>}

          <Button type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? "Creating…" : "Create workspace"}
          </Button>
        </div>

        <Link
          href="/workspaces"
          className="mt-6 block text-center text-[13.5px] font-medium text-[var(--muted)] hover:text-[var(--text)]"
        >
          ← Back to workspaces
        </Link>
      </form>
    </div>
  );
}
