"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminSectionTabsProps {
  canManageUsers: boolean;
}

const adminTabs = [
  { href: "/admin", label: "Dashboard", adminOnly: false },
  { href: "/admin/users", label: "Users", adminOnly: true },
] as const;

export function AdminSectionTabs({
  canManageUsers,
}: AdminSectionTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {adminTabs
        .filter((item) => (item.adminOnly ? canManageUsers : true))
        .map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm transition",
                isActive
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                  : "border border-[var(--color-border)] text-[var(--color-text)] hover:border-[rgba(194,154,98,0.34)] hover:bg-[rgba(255,255,255,0.03)]"
              )}
            >
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
