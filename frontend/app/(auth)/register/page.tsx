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

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiClient.post("/auth/register", { email, password, name });

      if (next) {
        // Coming from an invite link — log straight in so the destination
        // page (accept-invite) has a session to complete the join with.
        const { data } = await apiClient.post("/auth/login", { email, password });
        setTokens(data.access_token, data.refresh_token);
        router.push(next);
      } else {
        router.push("/login");
      }
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="GET STARTED"
      headline="Set up a smarter workspace for your team."
      subhead="Free forever for small teams. Upload your first document in under a minute."
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[400px] rounded-[18px] border border-[var(--border)] bg-white p-[34px] shadow-[var(--sh-1)]"
      >
        <h1 className="text-[22px] font-extrabold tracking-[-.02em] text-[var(--text)]">
          Create your CollabAI account
        </h1>
        <p className="mt-[6px] text-[13.5px] text-[var(--muted)]">
          No credit card required to get started.
        </p>

        <div className="mt-7 flex flex-col gap-4">
          <Field label="Name">
            <Input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {error && <Banner>{error}</Banner>}

          <Button type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? "Creating account…" : "Register"}
          </Button>
        </div>

        <p className="mt-6 text-center text-[13.5px] text-[var(--muted)]">
          Already have an account?{" "}
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="font-semibold text-[var(--accent-soft)]"
          >
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
