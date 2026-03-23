"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const fieldClassName =
  "h-12 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]";

interface ResetPasswordFormProps {
  token: string;
  tokenValid: boolean;
}

export function ResetPasswordForm({
  token,
  tokenValid,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!tokenValid) {
      setError("This reset link is invalid or has expired.");
      setSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to reset password.");
      }

      router.push(payload.redirectTo || "/login?reset=1");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reset password."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-4 text-sm text-[#ffcfcc]">
          A reset token is required. Request a new password reset email to continue.
        </div>
        <Link href="/forgot-password" className="text-sm text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!tokenValid ? (
        <div className="rounded-2xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-4 text-sm text-[#ffcfcc]">
          This reset link is invalid or has expired. Request a fresh link to continue.
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="reset-password"
          className="text-sm font-medium text-[var(--color-muted-strong)]"
        >
          New password
        </label>
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClassName}
          placeholder="At least 8 characters"
          required
          disabled={!tokenValid}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="reset-confirm-password"
          className="text-sm font-medium text-[var(--color-muted-strong)]"
        >
          Confirm password
        </label>
        <input
          id="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className={fieldClassName}
          placeholder="Repeat password"
          required
          disabled={!tokenValid}
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitting || !tokenValid}
      >
        {submitting ? "Resetting Password..." : "Reset Password"}
      </Button>

      <p className="text-sm text-[var(--color-muted-strong)]">
        Back to{" "}
        <Link
          href="/login"
          className="text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
        >
          sign in
        </Link>
      </p>
    </form>
  );
}
