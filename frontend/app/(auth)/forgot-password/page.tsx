"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="RESET PASSWORD"
      headline="Forgot your password?"
      subhead="Enter the email on your account and we'll send you a link to set a new one."
    >
      <div className="w-full max-w-[400px] rounded-[18px] border border-[var(--border)] bg-white p-[34px] shadow-[var(--sh-1)]">
        <h1 className="text-[22px] font-extrabold tracking-[-.02em] text-[var(--text)]">
          Reset your password
        </h1>
        <p className="mt-[6px] text-[13.5px] text-[var(--muted)]">
          We&apos;ll email you a link that&apos;s valid for a limited time.
        </p>

        {sent ? (
          <div className="mt-7 rounded-[12px] bg-[var(--green-bg)] px-4 py-3 text-[13.5px] text-[var(--green)]">
            If that email is registered, a reset link is on its way. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <Field label="Email">
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            {error && <Banner>{error}</Banner>}

            <Button type="submit" disabled={loading} className="mt-1 w-full">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-[13.5px] text-[var(--muted)]">
          <Link href="/login" className="font-semibold text-[var(--accent-soft)]">
            Back to log in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
