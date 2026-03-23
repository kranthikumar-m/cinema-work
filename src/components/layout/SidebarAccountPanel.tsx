"use client";

import Link from "next/link";
import { Shield, UserRound } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useAuthUser } from "@/components/auth/AuthUserProvider";

function getInitials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function SidebarAccountPanel() {
  const { user, isLoading } = useAuthUser();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] px-5 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.18)]">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[rgba(255,255,255,0.06)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded bg-[rgba(255,255,255,0.06)]" />
              <div className="h-3 w-2/3 rounded bg-[rgba(255,255,255,0.05)]" />
            </div>
          </div>
          <div className="h-10 rounded-xl bg-[rgba(255,255,255,0.05)]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] px-5 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.18)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[var(--color-text)]">
              Guest Viewer
            </p>
            <p className="truncate text-sm text-[var(--color-muted-strong)]">
              Sign in to manage your account
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text)] transition hover:border-[rgba(194,154,98,0.34)] hover:bg-[rgba(255,255,255,0.03)]"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-sm font-medium text-[var(--color-accent-contrast)] transition hover:brightness-105"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  const label = user.name?.trim() || user.email;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] px-5 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
          {getInitials(label)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[var(--color-text)]">
            {label}
          </p>
          <p className="truncate text-sm text-[var(--color-muted-strong)]">
            {user.email}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/account"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-xs uppercase tracking-[0.14em] text-[var(--color-text)] transition hover:border-[rgba(194,154,98,0.34)] hover:bg-[rgba(255,255,255,0.03)]"
        >
          Account
        </Link>
        {user.role === "admin" ? (
          <Link
            href="/admin"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 text-xs uppercase tracking-[0.14em] text-[var(--color-text)] transition hover:border-[rgba(194,154,98,0.34)] hover:bg-[rgba(255,255,255,0.03)]"
          >
            <Shield className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            <span>Admin</span>
          </Link>
        ) : null}
      </div>

      <div className="mt-4">
        <SignOutButton
          variant="ghost"
          className="h-auto w-full justify-start px-0 py-0 text-sm text-[var(--color-muted-strong)] hover:bg-transparent hover:text-[var(--color-text)]"
        />
      </div>
    </div>
  );
}
