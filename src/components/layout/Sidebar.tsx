"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CircleHelp, Menu, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteLogo } from "@/components/layout/SiteLogo";
import {
  APP_SIDEBAR_DESKTOP_WIDTH_CLASS,
  APP_SIDEBAR_DRAWER_WIDTH_CLASS,
  APP_SIDEBAR_ITEMS,
  isSidebarItemActive,
} from "@/components/layout/sidebar-config";

function SidebarBrand() {
  return (
    <Link
      href="/"
      className="w-full px-8 pt-8"
    >
      <SiteLogo variant="sidebar" priority />
    </Link>
  );
}

function SidebarDesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-10 flex w-full flex-col gap-1 px-0">
      {APP_SIDEBAR_ITEMS.map((item) => {
        const isActive = isSidebarItemActive(item.href, pathname);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "group relative flex min-h-[56px] items-center gap-5 px-10 py-4 text-left transition-all",
              isActive
                ? "bg-[rgba(255,255,255,0.03)] text-[var(--color-text)] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--color-accent)]"
                : "text-[var(--color-muted-strong)] hover:bg-white/4 hover:text-[var(--color-text)]"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span className="font-[family-name:var(--font-heading)] text-[1.1rem] font-medium uppercase tracking-[0.14em]">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)] shadow-[12px_0_35px_rgba(7,9,18,0.35)] lg:flex",
          APP_SIDEBAR_DESKTOP_WIDTH_CLASS
        )}
      >
        <SidebarBrand />
        <SidebarDesktopNav />
        <div className="mt-auto w-full px-8 pb-8">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] px-5 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[var(--color-text)]">
                  Curator Prime
                </p>
                <p className="truncate text-sm text-[var(--color-muted-strong)]">
                  Premium Member
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="mt-5 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted-strong)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
            aria-label="Help and info"
          >
            <CircleHelp className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[rgba(26,30,46,0.9)] text-[var(--color-text)] backdrop-blur-md lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)] px-6 pb-6 pt-6 shadow-[16px_0_36px_rgba(0,0,0,0.35)]",
              APP_SIDEBAR_DRAWER_WIDTH_CLASS
            )}
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <Link href="/" onClick={() => setOpen(false)} className="block">
                <SiteLogo variant="drawer" priority />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--color-border)] text-[var(--color-muted-strong)]"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1">
              {APP_SIDEBAR_ITEMS.map((item) => {
                const isActive = isSidebarItemActive(item.href, pathname);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "relative flex items-center gap-4 px-4 py-4 font-[family-name:var(--font-heading)] text-sm tracking-[0.18em] transition",
                      isActive
                        ? "bg-[rgba(255,255,255,0.03)] text-[var(--color-text)] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--color-accent)]"
                        : "text-[var(--color-muted-strong)] hover:bg-white/4 hover:text-[var(--color-text)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    Curator Prime
                  </p>
                  <p className="text-xs text-[var(--color-muted-strong)]">
                    Premium Member
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
