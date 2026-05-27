"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthUserProvider } from "@/components/auth/AuthUserProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { APP_SIDEBAR_CONTENT_OFFSET_CLASS } from "@/components/layout/sidebar-config";
import { cn } from "@/lib/utils";

interface AppChromeProps {
  children: ReactNode;
}

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <div className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)]">
        {children}
      </div>
    );
  }

  return (
    <AuthUserProvider>
      <Sidebar />
      <div
        className={cn(
          "relative flex min-h-[100dvh] flex-col bg-[var(--color-bg)] text-[var(--color-text)]",
          APP_SIDEBAR_CONTENT_OFFSET_CLASS
        )}
      >
        {isHome ? <HomeHeader /> : <TopNav />}
        <main className={cn("flex-1", isHome && "relative")}>{children}</main>
        <Footer className="bg-[var(--color-bg-deep)]" />
      </div>
    </AuthUserProvider>
  );
}
