"use client";

import { useState, type ReactNode } from "react";
import { SearchOverlay } from "@/components/layout/SearchOverlay";

interface SearchOverlayLauncherProps {
  children: (openSearch: () => void) => ReactNode;
}

export function SearchOverlayLauncher({
  children,
}: SearchOverlayLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {children(() => setOpen(true))}
      <SearchOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
