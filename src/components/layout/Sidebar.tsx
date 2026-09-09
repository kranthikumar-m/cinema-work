"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CircleHelp, Clapperboard, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { SidebarAccountPanel } from "@/components/layout/SidebarAccountPanel";
import { MovieSectionRail } from "@/components/movie/MovieSectionRail";
import {
  APP_SIDEBAR_DESKTOP_WIDTH_CLASS,
  APP_SIDEBAR_ITEMS,
  isSidebarItemActive,
} from "@/components/layout/sidebar-config";

/** Compact brand mark for the 72px icon rail. */
function RailBrand() {
  return (
    <Link
      href="/"
      className="flex h-[72px] w-full flex-col items-center justify-center gap-1 text-[var(--color-text)]"
      aria-label="Telugu Cinema Updates home"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[rgba(194,154,98,0.45)] text-[var(--color-accent)]">
        <Clapperboard className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="eyebrow-label text-[0.5rem] text-[var(--color-muted-strong)]">Cinema</span>
    </Link>
  );
}

function RailNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-2 flex w-full flex-col" aria-label="Primary">
      {APP_SIDEBAR_ITEMS.map((item) => {
        const isActive = isSidebarItemActive(item.href, pathname);

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-[64px] w-full flex-col items-center justify-center gap-1.5 transition-colors",
              isActive
                ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                : "text-[var(--color-muted)] hover:bg-white/[0.04] hover:text-[var(--color-text)]"
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
            <span className="eyebrow-label px-1 text-center text-[0.5rem] leading-none">
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
  // On a movie page the rail turns into that movie's section navigation.
  const isMoviePage = /^\/movie\/\d+/.test(pathname);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)] lg:flex",
          APP_SIDEBAR_DESKTOP_WIDTH_CLASS
        )}
      >
        <RailBrand />
        {isMoviePage ? <MovieSectionRail /> : <RailNav />}
        <div className="mt-auto flex w-full justify-center pb-5">
          <Link
            href="/news"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
            aria-label="About and news"
          >
            <CircleHelp className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-black/80 text-[var(--color-text)] backdrop-blur-md lg:hidden"
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
          <div className="absolute inset-y-0 left-0 flex w-[272px] flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)] px-5 pb-6 pt-6 shadow-[16px_0_36px_rgba(0,0,0,0.5)]">
            <div className="mb-8 flex items-start justify-between gap-4">
              <Link href="/" onClick={() => setOpen(false)} className="block">
                <SiteLogo variant="drawer" priority />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted-strong)]"
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
                      "relative flex items-center gap-3 rounded-md px-3 py-3 font-[family-name:var(--font-heading)] text-[0.76rem] font-semibold tracking-[0.12em] transition",
                      isActive
                        ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                        : "text-[var(--color-muted-strong)] hover:bg-white/5 hover:text-[var(--color-text)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6">
              <SidebarAccountPanel />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
