"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, Menu, X, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "@/components/layout/SearchOverlay";

const tabs = [
  { label: "All", href: "/" },
  { label: "News", href: "/news" },
  { label: "Features", href: "/features" },
  { label: "Trailers", href: "/videos" },
  { label: "Reviews", href: "/reviews" },
  { label: "Interviews", href: "/interviews" },
  { label: "Photos", href: "/photos" },
];

export function TopNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="flex items-center justify-between h-14 px-4 lg:pl-24">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
              <Film className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm font-bold text-cyan-400">CINEMAX</span>
          </Link>

          {/* Desktop tabs */}
          <nav className="hidden md:flex items-center gap-1 lg:ml-4">
            {tabs.map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  pathname === tab.href
                    ? "text-white bg-gray-800"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
            <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors">
              <User className="w-5 h-5" />
            </button>
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-800/50 px-4 py-3 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  pathname === tab.href
                    ? "text-white bg-gray-800"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
