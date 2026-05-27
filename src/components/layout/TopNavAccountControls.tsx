"use client";

import Link from "next/link";
import { Shield, UserRound } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useAuthUser } from "@/components/auth/AuthUserProvider";

export function TopNavAccountControls() {
  const { user, isLoading } = useAuthUser();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-11 w-28 animate-pulse rounded-full border border-[var(--color-border)] bg-[rgba(255,255,255,0.04)]" />
        <div className="h-11 w-11 animate-pulse rounded-full border border-[var(--color-border)] bg-[rgba(255,255,255,0.04)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-5 text-sm text-[var(--color-text)] transition hover:border-[rgba(194,154,98,0.34)] hover:bg-[rgba(255,255,255,0.03)]"
        >
          Log In
        </Link>
        <Link
          href="/register"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-5 text-sm font-medium text-[var(--color-accent-contrast)] transition hover:brightness-105"
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.role === "admin" ? (
        <Link
          href="/admin"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--color-border)] px-4 text-sm text-[var(--color-text)] transition hover:border-[rgba(194,154,98,0.34)] hover:bg-[rgba(255,255,255,0.03)]"
        >
          <Shield className="h-4 w-4 text-[var(--color-accent)]" />
          <span>Admin</span>
        </Link>
      ) : null}
      <Link
        href="/account"
        className="inline-flex h-11 items-center gap-3 rounded-full border border-[var(--color-border)] px-4 text-sm text-[var(--color-text)] transition hover:border-[rgba(194,154,98,0.34)] hover:bg-[rgba(255,255,255,0.03)]"
      >
        <UserRound className="h-4 w-4 text-[var(--color-accent)]" />
        <span className="max-w-[160px] truncate">
          {user.name?.trim() || user.email}
        </span>
      </Link>
      <SignOutButton
        variant="ghost"
        size="default"
        className="h-11 rounded-full px-4 text-[var(--color-muted-strong)] hover:text-[var(--color-text)]"
      />
    </div>
  );
}
