"use client";

import { Search } from "lucide-react";
import { SearchOverlayLauncher } from "@/components/layout/SearchOverlayLauncher";

export function HomeReferenceSearch() {
  return (
    <SearchOverlayLauncher>
      {(openSearch) => (
        <button
          type="button"
          onClick={openSearch}
          className="flex h-10 items-center gap-3 rounded-sm bg-[#090d1d] px-4 text-sm text-[#d2c4b5] transition hover:text-white"
          aria-label="Search archives"
        >
          <span className="hidden md:inline">Search archives...</span>
          <span className="md:hidden">Search</span>
          <Search className="h-[0.95rem] w-[0.95rem]" />
        </button>
      )}
    </SearchOverlayLauncher>
  );
}
