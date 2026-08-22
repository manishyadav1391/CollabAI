"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", { token, new_password: newPassword });
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail ?? "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="RESET PASSWORD"
      headline="Choose a new password."
      subhead="Pick something you haven't used before. This will sign you out everywhere else."
    >
      <div className="w-full max-w-[400px] rounded-[18px] border border-[var(--border)] bg-white p-[34px] shadow-[var(--sh-1)]">
        <h1 className="text-[22px] font-extrabold tracking-[-.02em] text-[var(--text)]">
          Set a new password
        </h1>

        {!token ? (
          <div className="mt-7">
            <Banner>This reset link is missing its token. Please request a new one.</Banner>
            <Link
              href="/forgot-password"
              className="mt-4 block text-center text-[13.5px] font-semibold text-[var(--accent-soft)]"
            >
              Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="mt-7 rounded-[12px] bg-[var(--green-bg)] px-4 py-3 text-[13.5px] text-[var(--green)]">
            Password reset. Redirecting you to log in…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <Field label="New password">
              <Input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>

            <Field label="Confirm new password">
              <Input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>

            {error && <Banner>{error}</Banner>}

            <Button type="submit" disabled={loading} className="mt-1 w-full">
              {loading ? "Resetting…" : "Reset password"}
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
