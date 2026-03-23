"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { APP_SIDEBAR_CONTENT_OFFSET_CLASS } from "@/components/layout/sidebar-config";
import { cn } from "@/lib/utils";

interface AppChromeProps {
  children: ReactNode;
}

export function AppChrome({ children }: AppChromeProps) {
  return (
    <>
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]",
          APP_SIDEBAR_CONTENT_OFFSET_CLASS
        )}
      >
        <TopNav />
        <main className="flex-1">{children}</main>
        <Footer className="bg-[var(--color-bg-deep)]" />
      </div>
    </>
  );
}
