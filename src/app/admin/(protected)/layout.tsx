import Link from "next/link";
import type { ReactNode } from "react";
import { AdminSectionTabs } from "@/components/admin/AdminSectionTabs";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { requireAdminUser, userCanManageUsers } from "@/lib/auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdminUser("/admin");
  const canManageUsers = userCanManageUsers(user.storedRole);

  return (
    <div className="min-h-screen px-5 py-8 md:px-8 xl:px-14">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <header className="rounded-[32px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.82)] p-7 shadow-[0_30px_80px_rgba(7,10,18,0.26)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-5">
              <Link href="/admin" className="inline-flex">
                <SiteLogo variant="nav" />
              </Link>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Administration
                </p>
                <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-text)]">
                  Secure backdrop and user management
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-muted-strong)]">
                  Signed in as{" "}
                  <span className="text-[var(--color-text)]">{user.email}</span>. Server-side role
                  guards protect every admin route and action in this console.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 xl:items-end">
              <AdminSectionTabs canManageUsers={canManageUsers} />
              <AdminSignOutButton />
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
