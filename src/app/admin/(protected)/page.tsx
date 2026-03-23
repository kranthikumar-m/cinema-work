import Link from "next/link";
import { AdminBackdropManager } from "@/components/admin/AdminBackdropManager";
import { listUsers, requireAdminUser, userCanManageUsers } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const user = await requireAdminUser("/admin");
  const canManageUsers = userCanManageUsers(user.storedRole);
  const users = canManageUsers ? await listUsers() : [];

  const summary = canManageUsers
    ? {
        totalUsers: users.length,
        activeUsers: users.filter((entry) => entry.isActive).length,
        disabledUsers: users.filter((entry) => !entry.isActive).length,
        adminUsers: users.filter((entry) => entry.role === "admin").length,
      }
    : null;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-5 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Backdrop access
          </p>
          <p className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--color-text)]">
            {user.storedRole === "editor" ? "Editor" : "Admin"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted-strong)]">
            This account can update the primary hero artwork used across the site.
          </p>
        </article>

        <article className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-5 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">Total users</p>
          <p className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--color-text)]">
            {summary?.totalUsers ?? "--"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted-strong)]">
            Full registered user count in the authentication database.
          </p>
        </article>

        <article className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-5 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Active accounts
          </p>
          <p className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--color-text)]">
            {summary?.activeUsers ?? "--"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted-strong)]">
            Accounts currently allowed to sign in and use protected features.
          </p>
        </article>

        <article className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-5 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Admin accounts
          </p>
          <p className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--color-text)]">
            {summary?.adminUsers ?? "--"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted-strong)]">
            Elevated users with access to user-management and protected administration routes.
          </p>
        </article>
      </section>

      {canManageUsers ? (
        <section className="flex flex-col gap-4 rounded-[28px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.2)] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
              User administration
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted-strong)]">
              Review users, roles, account status, and recovery readiness from the dedicated user
              management screen.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted-strong)]">
              Disabled users: {summary?.disabledUsers ?? 0}
            </div>
            <Link
              href="/admin/users"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-accent)] px-5 text-sm font-medium text-[var(--color-accent-contrast)] transition hover:brightness-105"
            >
              Manage Users
            </Link>
          </div>
        </section>
      ) : null}

      <AdminBackdropManager />
    </div>
  );
}
