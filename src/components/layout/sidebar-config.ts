import type { LucideIcon } from "lucide-react";
import {
  Rss,
  Clapperboard,
  UsersRound,
  Music4,
  Image as ImageIcon,
  PlayCircle,
  Info,
} from "lucide-react";

export interface AppSidebarItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export const APP_SIDEBAR_DESKTOP_WIDTH_CLASS = "lg:w-[304px]";
export const APP_SIDEBAR_CONTENT_OFFSET_CLASS = "lg:pl-[304px]";
export const APP_SIDEBAR_DRAWER_WIDTH_CLASS = "w-[280px]";

export const APP_SIDEBAR_ITEMS: AppSidebarItem[] = [
  { icon: Rss, label: "FEEDS", href: "/" },
  { icon: Clapperboard, label: "MOVIES", href: "/movies/trending" },
  { icon: UsersRound, label: "CAST & CREW", href: "/movies/popular" },
  { icon: Music4, label: "MUSIC", href: "/features" },
  { icon: ImageIcon, label: "GALLERY", href: "/photos" },
  { icon: PlayCircle, label: "VIDEOS", href: "/videos" },
  { icon: Info, label: "ABOUT", href: "/news" },
];

export function isSidebarItemActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
