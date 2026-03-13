"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Info, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteLogo } from "@/components/layout/SiteLogo";
import {
  APP_SIDEBAR_DESKTOP_WIDTH_CLASS,
  APP_SIDEBAR_DRAWER_WIDTH_CLASS,
  APP_SIDEBAR_ITEMS,
  isSidebarItemActive,
} from "@/components/layout/sidebar-config";

function SidebarBrand() {
  return (
    <Link
      href="/"
      className="mb-2 flex min-h-[94px] w-full items-center justify-center px-1 pt-2 text-center"
    >
      <SiteLogo className="max-w-[68px]" priority />
    </Link>
  );
}

function SidebarDesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full flex-1 flex-col gap-0 px-2">
      {APP_SIDEBAR_ITEMS.map((item) => {
        const isActive = isSidebarItemActive(item.href, pathname);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "group flex min-h-[60px] flex-col items-center justify-center gap-1.5 rounded-[22px] px-1.5 text-center transition-all",
              isActive
                ? "bg-[#19ecff] text-black shadow-[0_0_24px_rgba(25,236,255,0.25)]"
                : "text-white/78 hover:bg-white/8 hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            <span className="max-w-[62px] text-[0.64rem] font-medium uppercase leading-[1.25] tracking-[0.16em]">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
    <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col items-center bg-[#050505] pb-6 pt-4 shadow-[12px_0_35px_rgba(0,0,0,0.32)] lg:flex",
          APP_SIDEBAR_DESKTOP_WIDTH_CLASS
        )}
      >
        <SidebarBrand />
        <SidebarDesktopNav />
        <button
          type="button"
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/16 text-white/80 transition hover:border-white/32 hover:text-white"
          aria-label="Help and info"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-black/55 text-white backdrop-blur-md lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 flex flex-col bg-[#050505] px-4 pb-6 pt-6 shadow-[16px_0_36px_rgba(0,0,0,0.35)]",
              APP_SIDEBAR_DRAWER_WIDTH_CLASS
            )}
          >
            <div className="mb-8 flex items-center justify-between">
              <Link href="/" onClick={() => setOpen(false)} className="flex w-[150px]">
                <SiteLogo priority />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 text-white/70"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {APP_SIDEBAR_ITEMS.map((item) => {
                const isActive = isSidebarItemActive(item.href, pathname);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-4 rounded-[20px] px-4 py-4 text-sm tracking-[0.18em] transition",
                      isActive
                        ? "bg-[#19ecff] text-black"
                        : "text-white/84 hover:bg-white/8 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              className="mt-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/16 text-white/80"
              aria-label="Help and info"
            >
              <Info className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
