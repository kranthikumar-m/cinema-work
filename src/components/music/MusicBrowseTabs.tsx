"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS: { value: string; label: string }[] = [
  { value: "popular", label: "POPULAR" },
  { value: "latest", label: "NEW RELEASES" },
  { value: "az", label: "A-Z" },
];

export function MusicBrowseTabs({ view }: { view: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function tabHref(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "popular") params.delete("view");
    else params.set("view", value);
    params.delete("page");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="sticky top-[84px] z-20 -mx-[var(--app-page-gutter)] mb-6 border-b border-[var(--color-border)] bg-[rgba(26,30,46,0.92)] px-[var(--app-page-gutter)] py-3 backdrop-blur-xl">
      <nav className="scrollbar-hide flex items-center gap-5 overflow-x-auto sm:gap-7">
        {TABS.map((tab) => {
          const active = view === tab.value;
          return (
            <Link
              key={tab.value}
              href={tabHref(tab.value)}
              className={`relative whitespace-nowrap py-1 text-xs font-semibold uppercase tracking-[0.12em] transition sm:text-sm ${
                active
                  ? "text-[var(--color-text)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute -bottom-[13px] left-0 h-[2px] w-full rounded-full bg-[var(--color-accent)]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
