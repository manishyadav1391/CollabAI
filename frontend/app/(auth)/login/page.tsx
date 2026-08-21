"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { setTokens } from "@/lib/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await apiClient.post("/auth/login", { email, password });
      setTokens(data.access_token, data.refresh_token);
      router.push(next || "/workspaces");
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      headline="Your documents were exactly where you left them."
      subhead="Pick up the thread — every chat, citation, and permission is right where you left it."
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[400px] rounded-[18px] border border-[var(--border)] bg-white p-[34px] shadow-[var(--sh-1)]"
      >
        <h1 className="text-[22px] font-extrabold tracking-[-.02em] text-[var(--text)]">
          Log in to CollabAI
        </h1>
        <p className="mt-[6px] text-[13.5px] text-[var(--muted)]">
          Welcome back. Enter your details to continue.
        </p>

        <div className="mt-7 flex flex-col gap-4">
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {error && <Banner>{error}</Banner>}

          <Button type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </div>

        <p className="mt-6 text-center text-[13.5px] text-[var(--muted)]">
          No account?{" "}
          <Link
            href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
            className="font-semibold text-[var(--accent-soft)]"
          >
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
