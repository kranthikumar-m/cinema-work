"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchOverlayLauncher } from "@/components/layout/SearchOverlayLauncher";
import { SiteLogo } from "@/components/layout/SiteLogo";

const tabs = [
  { label: "OVERVIEW", href: "/" },
  { label: "CRITICS", href: "/reviews" },
  { label: "BOX OFFICE", href: "/movies/trending" },
];

function isTabActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[rgba(28,33,51,0.92)] backdrop-blur-xl">
      <div className="flex h-[84px] items-center justify-between px-5 md:px-8 xl:px-14">
        <div className="flex items-center gap-10">
          <Link href="/" className="ml-14 block lg:hidden">
            <SiteLogo variant="nav" priority />
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            {tabs.map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "font-[family-name:var(--font-heading)] text-[1.05rem] font-semibold uppercase tracking-[0.02em] transition-colors",
                  isTabActive(pathname, tab.href)
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-muted-strong)] hover:text-[var(--color-text)]"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <SearchOverlayLauncher>
            {(openSearch) => (
              <button
                type="button"
                onClick={openSearch}
                className="flex h-11 items-center gap-3 rounded-md border border-[var(--color-border)] bg-[rgba(20,24,39,0.82)] px-4 text-sm text-[var(--color-muted)] transition hover:border-[rgba(194,154,98,0.32)] hover:text-[var(--color-text)] md:w-[300px]"
                aria-label="Search archives"
              >
                <span className="truncate">Search archives...</span>
                <Search className="ml-auto h-4 w-4 shrink-0 text-[var(--color-accent)]" />
              </button>
            )}
          </SearchOverlayLauncher>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted-strong)] transition hover:border-[rgba(194,154,98,0.32)] hover:text-[var(--color-text)]"
            aria-label="Profile"
          >
            <UserRound className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
