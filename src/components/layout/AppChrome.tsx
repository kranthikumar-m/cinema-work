"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
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

  if (isHome) {
    return (
      <>
        <Sidebar />
        <div
          className={cn(
            "flex min-h-screen flex-col bg-[#050505] text-white",
            APP_SIDEBAR_CONTENT_OFFSET_CLASS
          )}
        >
          <main className="flex-1">{children}</main>
          <Footer
            className="border-white/10 bg-[#050505]"
            contentClassName="px-5 py-10 md:px-8 xl:px-12"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col",
          APP_SIDEBAR_CONTENT_OFFSET_CLASS
        )}
      >
        <TopNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
