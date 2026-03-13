"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Film,
  Play,
  Star,
  Users,
  Image as ImageIcon,
  Video,
  Music,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutGrid, label: "Feed", href: "/" },
  { icon: Film, label: "Movies", href: "/movies/trending" },
  { icon: Play, label: "Trailers", href: "/videos" },
  { icon: Star, label: "Reviews", href: "/reviews" },
  { icon: Users, label: "Cast & Crew", href: "/movies/popular" },
  { icon: ImageIcon, label: "Photos", href: "/photos" },
  { icon: Video, label: "Videos", href: "/videos" },
  { icon: Music, label: "Music", href: "/features" },
  { icon: Info, label: "About", href: "/news" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-20 flex-col items-center bg-gray-950/95 border-r border-gray-800/50 backdrop-blur-sm pt-4 pb-6">
      <Link href="/" className="mb-8 flex flex-col items-center gap-1">
        <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
          <Film className="w-5 h-5 text-black" />
        </div>
        <span className="text-[10px] font-bold text-cyan-400 tracking-wider">
          TCU
        </span>
      </Link>

      <nav className="flex-1 flex flex-col gap-1 w-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 rounded-lg text-[10px] font-medium transition-all",
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400"
                  : "text-gray-500 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
