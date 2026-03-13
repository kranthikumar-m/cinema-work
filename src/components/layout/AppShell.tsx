"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="lg:pl-20 min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
