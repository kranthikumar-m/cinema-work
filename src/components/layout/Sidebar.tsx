"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import {
  APP_SIDEBAR_DESKTOP_WIDTH_CLASS,
  APP_SIDEBAR_DRAWER_WIDTH_CLASS,
  APP_SIDEBAR_ITEMS,
  isSidebarItemActive,
} from "@/components/layout/sidebar-config";

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col items-center border-r border-gray-800/50 bg-gray-950/95 pb-6 pt-5 backdrop-blur-sm lg:flex",
          APP_SIDEBAR_DESKTOP_WIDTH_CLASS
        )}
      >
        <Logo
          size={44}
          showLabel
          className="mb-8 flex-col"
          labelClass="mt-1 text-[10px] font-bold tracking-wider text-cyan-400"
        />

        <nav className="flex w-full flex-1 flex-col gap-1 px-2">
          {APP_SIDEBAR_ITEMS.map((item) => {
            const isActive = isSidebarItemActive(item.href, pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg py-2.5 text-[10px] font-medium transition-all",
                  isActive
                    ? "border-l-2 border-cyan-400 bg-cyan-500/10 text-cyan-400"
                    : "text-gray-500 hover:bg-gray-800/50 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile menu trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-800/60 bg-gray-900/90 text-white backdrop-blur-md lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
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
              "absolute inset-y-0 left-0 flex flex-col border-r border-gray-800/50 bg-gray-950 px-5 pb-6 pt-6 shadow-[16px_0_36px_rgba(0,0,0,0.35)]",
              APP_SIDEBAR_DRAWER_WIDTH_CLASS
            )}
          >
            <div className="mb-8 flex items-center justify-between">
              <Link href="/" onClick={() => setOpen(false)}>
                <Logo size={36} showLabel />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-800/60 text-gray-300"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1">
              {APP_SIDEBAR_ITEMS.map((item) => {
                const isActive = isSidebarItemActive(item.href, pathname);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm tracking-[0.14em] transition",
                      isActive
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
