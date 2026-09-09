import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WidgetShellProps {
  title: string;
  icon: LucideIcon;
  href?: string;
  linkLabel?: string;
  /** Short grey note after the title, e.g. today's date. */
  note?: string;
  children: ReactNode;
  className?: string;
}

/** Sidebar widget frame: icon + uppercase title, optional See All, content. */
export function WidgetShell({
  title,
  icon: Icon,
  href,
  linkLabel = "See All",
  note,
  children,
  className,
}: WidgetShellProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4",
        className
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.1em] text-[var(--color-text)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <Icon className="h-3.5 w-3.5" />
          </span>
          {title}
          {note && (
            <span className="font-[family-name:var(--font-body)] text-[11px] font-normal normal-case tracking-normal text-[var(--color-muted)]">
              | {note}
            </span>
          )}
        </h3>
        {href && (
          <Link
            href={href}
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
          >
            {linkLabel}
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

interface WidgetTabsProps<T extends string> {
  tabs: { key: T; label: string; count?: number }[];
  active: T;
  onChange: (key: T) => void;
}

/** Pill tabs used inside widgets (Today / Upcoming / Latest, and so on). */
export function WidgetTabs<T extends string>({ tabs, active, onChange }: WidgetTabsProps<T>) {
  return (
    <div role="tablist" className="mb-3 flex flex-wrap gap-1.5">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold transition",
              isActive
                ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                : "border border-[var(--color-border)] text-[var(--color-muted-strong)] hover:text-[var(--color-text)]"
            )}
          >
            {tab.label}
            {typeof tab.count === "number" && tab.count > 0 ? (
              <span className="ml-1 opacity-70">{tab.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function WidgetEmpty({ children }: { children: ReactNode }) {
  return <p className="py-4 text-center text-xs text-[var(--color-muted)]">{children}</p>;
}
