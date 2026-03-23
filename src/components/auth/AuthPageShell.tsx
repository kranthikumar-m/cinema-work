import Link from "next/link";
import type { ReactNode } from "react";
import { SiteLogo } from "@/components/layout/SiteLogo";

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <div className="min-h-[calc(100vh-84px)] px-5 py-10 md:px-8 xl:px-14">
      <div className="mx-auto grid max-w-[1280px] gap-8 lg:grid-cols-[0.95fr_minmax(0,1.05fr)] lg:items-stretch">
        <section className="relative overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(194,154,98,0.14),rgba(26,30,46,0.08))] p-8 shadow-[0_28px_75px_rgba(5,8,18,0.24)] md:p-10">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(194,154,98,0.18),rgba(194,154,98,0))]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div>
              <SiteLogo variant="sidebar" />
              <p className="mt-12 text-sm uppercase tracking-[0.28em] text-[var(--color-accent)]">
                Telugu-first access
              </p>
              <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-bold leading-tight text-[var(--color-text)] md:text-5xl">
                Accounts, saved sessions, and admin controls for the full Telugu movie platform.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[var(--color-muted-strong)]">
                Register real accounts, manage sessions securely, and unlock protected editorial
                and admin workflows without leaving the site’s existing design language.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(18,22,35,0.64)] p-5">
                <p className="text-sm font-semibold text-[var(--color-text)]">Real account flow</p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted-strong)]">
                  Credentials login, reset tokens, cookie-backed sessions, and protected routes.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(18,22,35,0.64)] p-5">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Telugu-site administration
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted-strong)]">
                  Admins control backdrop overrides and manage the users who keep the site running.
                </p>
              </div>
            </div>

            <div className="text-sm text-[var(--color-muted)]">
              <span>Need help?</span>{" "}
              <Link href="/news" className="text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]">
                Explore the latest Telugu coverage
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-[var(--color-border)] bg-[rgba(16,20,31,0.84)] p-8 shadow-[0_30px_80px_rgba(5,8,18,0.28)] md:p-10">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-accent)]">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-text)]">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted-strong)]">
            {description}
          </p>

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8">{footer}</div> : null}
        </section>
      </div>
    </div>
  );
}
