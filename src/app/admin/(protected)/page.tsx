import { AdminBackdropManager } from "@/components/admin/AdminBackdropManager";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { listAdminUsers, requireAdminUser } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const user = await requireAdminUser(["admin", "editor"]);
  const users = user.role === "admin" ? await listAdminUsers() : [];

  return (
    <div className="min-h-screen px-5 py-8 md:px-8 xl:px-14">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <div className="flex flex-col gap-4 rounded-[32px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.82)] p-7 shadow-[0_30px_80px_rgba(7,10,18,0.26)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Backdrop Control
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-text)]">
              Admin Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-muted-strong)]">
              Signed in as <span className="text-[var(--color-text)]">{user.email}</span> ·{" "}
              <span className="uppercase tracking-[0.12em] text-[var(--color-accent)]">
                {user.role}
              </span>
            </p>
          </div>
          <AdminSignOutButton />
        </div>

        <AdminBackdropManager />

        {user.role === "admin" ? (
          <AdminUserManagement initialUsers={users} />
        ) : null}
      </div>
    </div>
  );
}
