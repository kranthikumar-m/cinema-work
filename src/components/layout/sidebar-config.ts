import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Film,
  Users,
  Music,
  Image as ImageIcon,
  Video,
  Info,
} from "lucide-react";

export interface AppSidebarItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export const APP_SIDEBAR_DESKTOP_WIDTH_CLASS = "lg:w-[82px]";
export const APP_SIDEBAR_CONTENT_OFFSET_CLASS = "lg:pl-[82px]";
export const APP_SIDEBAR_DRAWER_WIDTH_CLASS = "w-[280px]";

export const APP_SIDEBAR_ITEMS: AppSidebarItem[] = [
  { icon: LayoutGrid, label: "FEEDS", href: "/" },
  { icon: Film, label: "MOVIES", href: "/movies/trending" },
  { icon: Users, label: "CAST & CREW", href: "/movies/popular" },
  { icon: Music, label: "MUSIC", href: "/features" },
  { icon: ImageIcon, label: "GALLERY", href: "/photos" },
  { icon: Video, label: "VIDEOS", href: "/videos" },
  { icon: Info, label: "ABOUT", href: "/news" },
];

export function isSidebarItemActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
