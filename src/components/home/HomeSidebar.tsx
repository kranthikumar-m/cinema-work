"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Info,
  LayoutGrid,
  Film,
  Users,
  Music,
  Image as ImageIcon,
  Video,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutGrid, label: "FEEDS", href: "/" },
  { icon: Film, label: "MOVIES", href: "/movies/trending" },
  { icon: Users, label: "CAST & CREW", href: "/movies/popular" },
  { icon: Music, label: "MUSIC", href: "/features" },
  { icon: ImageIcon, label: "GALLERY", href: "/photos" },
  { icon: Video, label: "VIDEOS", href: "/videos" },
  { icon: Info, label: "ABOUT", href: "/news" },
];

function BrandMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/85">
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="h-8 w-8 text-white"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.8"
      >
        <path d="M5 24h10l4-8 7 18 6-14h11" />
      </svg>
    </div>
  );
}

function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-3 px-3 md:px-2 xl:px-3">
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "group flex flex-col items-center justify-center gap-2 rounded-[22px] px-2 py-4 text-center transition-all md:min-h-[92px] xl:min-h-[98px]",
              isActive
                ? "bg-[#19ecff] text-black shadow-[0_0_20px_rgba(25,236,255,0.28)]"
                : "text-white/82 hover:bg-white/8 hover:text-white"
            )}
          >
            <item.icon
              className={cn(
                "h-6 w-6 md:h-5 md:w-5 xl:h-6 xl:w-6",
                !isActive && "text-white/80"
              )}
            />
            <span className="text-[10px] font-medium tracking-[0.18em] md:hidden xl:block">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function HomeSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[88px] flex-col items-center bg-[#050505] pb-6 pt-6 shadow-[12px_0_35px_rgba(0,0,0,0.32)] md:flex xl:w-[120px]">
        <Link href="/" className="mb-7 flex flex-col items-center gap-4 px-3 text-center">
          <BrandMark />
          <div className="space-y-1">
            <p className="text-lg font-light tracking-[0.12em] text-white">TCU</p>
            <p className="text-[10px] tracking-[0.35em] text-white/72">CINEMA</p>
          </div>
        </Link>

        <SidebarNav />

        <button
          type="button"
          className="mt-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/16 text-white/80 transition hover:border-white/32 hover:text-white"
          aria-label="Help and info"
        >
          <Info className="h-5 w-5" />
        </button>
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-5 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-black/55 text-white backdrop-blur-md md:hidden"
        aria-label="Open homepage navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-[#050505] px-4 pb-6 pt-6 shadow-[16px_0_36px_rgba(0,0,0,0.35)]">
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3"
              >
                <BrandMark />
                <div className="space-y-1">
                  <p className="text-lg font-light tracking-[0.12em] text-white">TCU</p>
                  <p className="text-[10px] tracking-[0.35em] text-white/72">CINEMA</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 text-white/70"
                aria-label="Close homepage navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

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
