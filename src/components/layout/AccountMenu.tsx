"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogIn, Shield, UserRound, UserRoundPlus } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface AccountMenuProps {
  /** `overlay` sits on the hero image; `bar` sits in the sticky top bar. */
  variant?: "bar" | "overlay";
}

/**
 * Compact account control for the top bar: a single round icon that opens a
 * small menu (Log in / Register for guests; Account, Admin, Sign out for users).
 * Replaces the wide sidebar account panel now that the sidebar is an icon rail.
 */
export function AccountMenu({ variant = "bar" }: AccountMenuProps) {
  const { user, isLoading } = useAuthUser();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const buttonClass = cn(
    "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition",
    variant === "overlay"
      ? "border-white/15 bg-black/20 text-white/92 backdrop-blur-[10px] hover:border-white/30 hover:bg-black/35"
      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[rgba(26,167,230,0.5)]"
  );

  if (isLoading) {
    return <div className={cn(buttonClass, "animate-pulse")} aria-hidden="true" />;
  }

  const label = user ? user.name?.trim() || user.email : "Account";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={buttonClass}
        aria-label={user ? `Account menu for ${label}` : "Account menu"}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user ? (
          <span className="text-xs tracking-[0.08em] text-[var(--color-accent)]">
            {getInitials(label)}
          </span>
        ) : (
          <UserRound className="h-[18px] w-[18px]" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
        >
          {user ? (
            <>
              <div className="border-b border-[var(--color-border)] px-4 py-3">
                <p className="truncate text-sm font-semibold text-[var(--color-text)]">{label}</p>
                <p className="truncate text-xs text-[var(--color-muted)]">{user.email}</p>
              </div>
              <Link
                href="/account"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text)] transition hover:bg-white/5"
              >
                <UserRound className="h-4 w-4 text-[var(--color-accent)]" />
                My account
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text)] transition hover:bg-white/5"
                >
                  <Shield className="h-4 w-4 text-[var(--color-accent)]" />
                  Admin console
                </Link>
              )}
              <div className="border-t border-[var(--color-border)] px-2 py-1.5">
                <SignOutButton
                  variant="ghost"
                  className="h-9 w-full justify-start px-2 text-sm text-[var(--color-muted-strong)] hover:bg-white/5 hover:text-[var(--color-text)]"
                />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text)] transition hover:bg-white/5"
              >
                <LogIn className="h-4 w-4 text-[var(--color-accent)]" />
                Log in
              </Link>
              <Link
                href="/register"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 border-t border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text)] transition hover:bg-white/5"
              >
                <UserRoundPlus className="h-4 w-4 text-[var(--color-accent)]" />
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
