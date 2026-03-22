"use client";

import { Search } from "lucide-react";
import { SearchOverlayLauncher } from "@/components/layout/SearchOverlayLauncher";

export function HomeFeatureSearchTrigger() {
  return (
    <SearchOverlayLauncher>
      <button
        type="button"
        className="group flex h-11 items-center gap-3 rounded-[10px] border border-white/10 bg-[#090d1d]/82 px-4 text-sm text-white/64 transition hover:border-[#ebbf84]/30 hover:text-white"
      >
        <span className="hidden md:inline">Search archives...</span>
        <span className="md:hidden">Search</span>
        <Search className="h-4 w-4 text-white/72" />
      </button>
    </SearchOverlayLauncher>
  );
}
