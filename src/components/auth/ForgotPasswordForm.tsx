"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const fieldClassName =
  "h-12 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]";

interface ForgotPasswordFormProps {
  nextPath?: string;
}

export function ForgotPasswordForm({ nextPath }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setResetUrl(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        resetUrl?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to send reset instructions.");
      }

      setSuccessMessage(
        payload.message ||
          "If an account exists for that email, password reset instructions are ready."
      );
      setResetUrl(payload.resetUrl ?? null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send reset instructions."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="forgot-email" className="text-sm font-medium text-[var(--color-muted-strong)]">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClassName}
          placeholder="name@example.com"
          required
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="space-y-3 rounded-2xl border border-[rgba(88,144,104,0.28)] bg-[rgba(35,72,46,0.26)] px-4 py-4 text-sm text-[#d5f3dc]">
          <p>{successMessage}</p>
          {resetUrl ? (
            <p className="break-all text-xs text-[#e8ffe9]">
              Development reset link:{" "}
              <a href={resetUrl} className="underline underline-offset-4">
                {resetUrl}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Sending..." : "Send Reset Instructions"}
      </Button>

      <p className="text-sm text-[var(--color-muted-strong)]">
        Remembered it?{" "}
        <Link
          href={loginHref}
          className="text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
        >
          Return to sign in
        </Link>
      </p>
    </form>
  );
}
