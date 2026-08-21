"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/lib/api-client";
import { clearTokens, isLoggedIn } from "@/lib/auth";
import type { InvitePreview } from "@/lib/types";
import { AuthShell } from "@/components/auth/AuthShell";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";

type Status = "loading" | "invalid" | "unauthenticated" | "accepting" | "mismatch" | "error" | "success";

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteFlow />
    </Suspense>
  );
}

function AcceptInviteFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<Status>(token ? "loading" : "invalid");
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [message, setMessage] = useState<string | null>(
    token ? null : "This invite link is missing its token."
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    apiClient
      .get<InvitePreview>(`/workspaces/invites/${token}`)
      .then(({ data }) => {
        if (cancelled) return;
        setInvite(data);
        if (isLoggedIn()) {
          acceptNow();
        } else {
          setStatus("unauthenticated");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
        setMessage(detail ?? "This invite link is invalid.");
        setStatus("invalid");
      });

    async function acceptNow() {
      setStatus("accepting");
      try {
        const { data } = await apiClient.post(`/workspaces/invites/${token}/accept`);
        setStatus("success");
        router.push(`/w/${data.workspace_id}/dashboard`);
      } catch (err) {
        if (cancelled) return;
        const code = axios.isAxiosError(err) ? err.response?.status : undefined;
        const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
        if (code === 403) {
          setMessage(detail ?? "This invite was sent to a different email address.");
          setStatus("mismatch");
        } else {
          setMessage(detail ?? "Something went wrong accepting this invite.");
          setStatus("error");
        }
      }
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleLogOut() {
    clearTokens();
    router.push(`/login?next=${encodeURIComponent(`/accept-invite?token=${token}`)}`);
  }

  return (
    <AuthShell
      eyebrow="YOU'RE INVITED"
      headline={invite ? `Join ${invite.workspace_name} on CollabAI.` : "Join a workspace on CollabAI."}
      subhead="Accept the invite to start collaborating on documents, chats, and projects with your team."
    >
      <div className="w-full max-w-[400px] rounded-[18px] border border-[var(--border)] bg-white p-[34px] shadow-[var(--sh-1)]">
        {status === "loading" && (
          <p className="text-[14px] text-[var(--muted)]">Checking your invite…</p>
        )}

        {status === "accepting" && (
          <p className="text-[14px] text-[var(--muted)]">Joining {invite?.workspace_name}…</p>
        )}

        {status === "success" && (
          <p className="text-[14px] text-[var(--muted)]">You&apos;re in! Redirecting…</p>
        )}

        {status === "invalid" && (
          <>
            <h1 className="text-[22px] font-extrabold tracking-[-.02em] text-[var(--text)]">
              Invite not valid
            </h1>
            <div className="mt-5">
              <Banner>{message ?? "This invite link is invalid or has expired."}</Banner>
            </div>
            <Button href="/login" className="mt-6 w-full">
              Go to login
            </Button>
          </>
        )}

        {status === "mismatch" && (
          <>
            <h1 className="text-[22px] font-extrabold tracking-[-.02em] text-[var(--text)]">
              Wrong account
            </h1>
            <div className="mt-5">
              <Banner>
                {`This invite was sent to ${
                  invite?.email ?? "a different address"
                }. Log out and sign in with that address to accept it.`}
              </Banner>
            </div>
            <Button onClick={handleLogOut} className="mt-6 w-full">
              Log out
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-[22px] font-extrabold tracking-[-.02em] text-[var(--text)]">
              Couldn&apos;t accept invite
            </h1>
            <div className="mt-5">
              <Banner>{message ?? "Something went wrong. Please try again."}</Banner>
            </div>
            <Button onClick={() => window.location.reload()} className="mt-6 w-full">
              Try again
            </Button>
          </>
        )}

        {status === "unauthenticated" && invite && (
          <>
            <h1 className="text-[22px] font-extrabold tracking-[-.02em] text-[var(--text)]">
              You&apos;ve been invited
            </h1>
            <p className="mt-[6px] text-[13.5px] text-[var(--muted)]">
              <strong className="text-[var(--text)]">{invite.workspace_name}</strong> invited{" "}
              {invite.email} to join as {invite.role}.
            </p>

            <div className="mt-7 flex flex-col gap-3">
              <Button
                href={`/register?next=${encodeURIComponent(`/accept-invite?token=${token}`)}&email=${encodeURIComponent(invite.email)}`}
                className="w-full"
              >
                Create an account
              </Button>
              <Button
                variant="secondary"
                href={`/login?next=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
                className="w-full"
              >
                I already have an account
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
