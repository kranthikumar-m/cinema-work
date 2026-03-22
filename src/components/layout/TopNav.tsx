"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { Logo } from "@/components/shared/Logo";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="flex h-14 items-center justify-between px-4 md:px-6 xl:px-8">
          {/* Mobile logo */}
          <div className="lg:hidden">
            <Logo size={32} showLabel={true} />
          </div>

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
            <SearchOverlayLauncher>
              {(openSearch) => (
                <button
                  onClick={openSearch}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              )}
            </SearchOverlayLauncher>
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
    </>
  );
}
