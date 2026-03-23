"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const fieldClassName =
  "h-12 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]";

interface LoginFormProps {
  nextPath?: string;
  showRegisteredNotice?: boolean;
  showResetNotice?: boolean;
}

export function LoginForm({
  nextPath,
  showRegisteredNotice = false,
  showResetNotice = false,
}: LoginFormProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          next: nextPath,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to sign in.");
      }

      router.push(payload.redirectTo || "/account");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const registerHref = nextPath
    ? `/register?next=${encodeURIComponent(nextPath)}`
    : "/register";
  const forgotHref = nextPath
    ? `/forgot-password?next=${encodeURIComponent(nextPath)}`
    : "/forgot-password";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {showRegisteredNotice ? (
        <div className="rounded-2xl border border-[rgba(88,144,104,0.28)] bg-[rgba(35,72,46,0.26)] px-4 py-3 text-sm text-[#d5f3dc]">
          Your account is ready. Sign in to continue.
        </div>
      ) : null}

      {showResetNotice ? (
        <div className="rounded-2xl border border-[rgba(88,144,104,0.28)] bg-[rgba(35,72,46,0.26)] px-4 py-3 text-sm text-[#d5f3dc]">
          Your password has been reset. Sign in with the new password.
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="login-identifier" className="text-sm font-medium text-[var(--color-muted-strong)]">
          Username or email
        </label>
        <input
          id="login-identifier"
          type="text"
          autoComplete="username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          className={fieldClassName}
          placeholder="admin123 or name@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-[var(--color-muted-strong)]"
          >
            Password
          </label>
          <Link
            href={forgotHref}
            className="text-xs uppercase tracking-[0.16em] text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
          >
            Forgot password
          </Link>
        </div>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClassName}
          placeholder="Enter your password"
          required
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
          {error}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Signing In..." : "Sign In"}
      </Button>

      <p className="text-sm text-[var(--color-muted-strong)]">
        New here?{" "}
        <Link
          href={registerHref}
          className="text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
