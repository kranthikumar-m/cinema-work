import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="app-page-shell-narrow py-12">
      <div className="rounded-[32px] border border-[var(--color-border)] bg-[rgba(16,20,31,0.84)] p-8 shadow-[0_30px_80px_rgba(5,8,18,0.28)] md:p-10">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Access denied
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-text)]">
          You do not have permission to view this page.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted-strong)]">
          This route is protected. Sign in with an authorized account or return to the public Telugu
          movie pages.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-5 text-sm font-medium text-[var(--color-accent-contrast)] transition hover:brightness-105"
          >
            Sign In
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] px-5 text-sm text-[var(--color-text)] transition hover:border-[rgba(194,154,98,0.34)] hover:bg-[rgba(255,255,255,0.03)]"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
