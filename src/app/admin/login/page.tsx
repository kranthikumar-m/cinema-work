import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getCurrentAdminUser } from "@/lib/auth";
import { env } from "@/lib/env";

export default async function AdminLoginPage() {
  const user = await getCurrentAdminUser();

  if (user?.role === "admin" || user?.role === "editor") {
    redirect("/admin");
  }

  const missingConfig = !env.DATABASE_URL || !env.AUTH_SECRET;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-[480px] rounded-[32px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.86)] p-8 shadow-[0_30px_80px_rgba(7,10,18,0.28)]">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Admin Access
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-text)]">
          Sign in to manage hero backdrops
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--color-muted-strong)]">
          Admin and editor accounts can choose the exact TMDB backdrop used across the homepage hero
          and movie detail pages.
        </p>

        {missingConfig ? (
          <div className="mt-6 rounded-xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
            Set <code>DATABASE_URL</code> and <code>AUTH_SECRET</code> before using admin controls.
          </div>
        ) : null}

        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
