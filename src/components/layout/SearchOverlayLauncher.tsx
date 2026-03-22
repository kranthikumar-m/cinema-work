"use client";

import {
  cloneElement,
  isValidElement,
  useState,
  type MouseEventHandler,
  type ReactElement,
} from "react";
import { SearchOverlay } from "@/components/layout/SearchOverlay";

interface SearchOverlayLauncherProps {
  children: ReactElement<{
    onClick?: MouseEventHandler<HTMLElement>;
  }>;
}

export function SearchOverlayLauncher({
  children,
}: SearchOverlayLauncherProps) {
  const [open, setOpen] = useState(false);
  const openSearch = () => setOpen(true);

  if (!isValidElement(children)) {
    return null;
  }

  const childOnClick = children.props.onClick;

  return (
    <>
      {cloneElement(children, {
        onClick: (event) => {
          childOnClick?.(event);
          if (event.defaultPrevented) return;
          openSearch();
        },
      })}
      <SearchOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
