import Link from "next/link";
import { AccountProfileForm } from "@/components/auth/AccountProfileForm";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await requireAuthenticatedUser("/account");

  return (
    <div className="app-page-shell-compact py-10">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <section className="rounded-[32px] border border-[var(--color-border)] bg-[rgba(16,20,31,0.84)] p-8 shadow-[0_30px_80px_rgba(5,8,18,0.28)] md:p-10">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Your account
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-text)]">
            Manage your profile
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-muted-strong)]">
            Update the profile information tied to your authenticated session. Server-side guards
            keep this page private to the current account.
          </p>

          <div className="mt-8">
            <AccountProfileForm initialUser={user} />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(16,20,31,0.84)] p-6 shadow-[0_24px_70px_rgba(5,8,18,0.24)]">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
              Account details
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="uppercase tracking-[0.14em] text-[var(--color-muted)]">Role</dt>
                <dd className="mt-1 text-[var(--color-text)]">
                  {user.role === "admin" ? "Admin" : "User"}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.14em] text-[var(--color-muted)]">Created</dt>
                <dd className="mt-1 text-[var(--color-text)]">
                  {new Date(user.createdAt).toLocaleDateString("en-GB")}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Last login
                </dt>
                <dd className="mt-1 text-[var(--color-text)]">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString("en-GB")
                    : "First session"}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <SignOutButton className="w-full" />
            </div>
          </section>

          {user.role === "admin" ? (
            <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(16,20,31,0.84)] p-6 shadow-[0_24px_70px_rgba(5,8,18,0.24)]">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
                Admin access
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted-strong)]">
                Your account has elevated permissions for backdrop control and user management.
              </p>
              <Link
                href="/admin"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-5 text-sm font-medium text-[var(--color-accent-contrast)] transition hover:brightness-105"
              >
                Open Admin Dashboard
              </Link>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
