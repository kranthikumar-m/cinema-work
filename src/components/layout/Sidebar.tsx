"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Film,
  Play,
  Star,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

const navItems = [
  { icon: LayoutGrid, label: "Feed", href: "/" },
  { icon: Film, label: "Telugu", href: "/movies/telugu" },
  { icon: Film, label: "Hindi", href: "/movies/hindi" },
  { icon: Film, label: "Tamil", href: "/movies/tamil" },
  { icon: Film, label: "Kannada", href: "/movies/kannada" },
  { icon: Film, label: "Malayalam", href: "/movies/malayalam" },
  { icon: Play, label: "Trailers", href: "/videos" },
  { icon: Star, label: "Reviews", href: "/reviews" },
  { icon: Info, label: "News", href: "/news" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-20 flex-col items-center bg-gray-950/95 border-r border-gray-800/50 backdrop-blur-sm pt-4 pb-6">
      <div className="mb-8 flex flex-col items-center gap-1">
        <Logo
          size={40}
          showLabel={true}
          className="flex-col"
          labelClass="text-[10px] font-bold text-cyan-400 tracking-wider"
        />
      </div>

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
