"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { HomeSidebar } from "@/components/home/HomeSidebar";

interface AppChromeProps {
  children: ReactNode;
}

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return (
      <>
        <HomeSidebar />
        <div className="flex min-h-screen flex-col bg-[#050505] text-white md:pl-[88px] xl:pl-[120px]">
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
      <div className="flex min-h-screen flex-col lg:pl-20">
        <TopNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
