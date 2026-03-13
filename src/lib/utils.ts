import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(
  path: string | null,
  size: "w200" | "w300" | "w500" | "w780" | "w1280" | "original" = "w500"
): string {
  if (!path) return "/placeholder-movie.svg";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getBackdropUrl(
  path: string | null,
  size: "w780" | "w1280" | "original" = "w1280"
): string {
  if (!path) return "/placeholder-backdrop.svg";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "TBA";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRuntime(minutes: number): string {
  if (!minutes) return "N/A";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatCurrency(amount: number): string {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getRatingColor(rating: number): string {
  if (rating >= 7) return "text-green-400";
  if (rating >= 5) return "text-yellow-400";
  return "text-red-400";
}

export function getRatingBorderColor(rating: number): string {
  if (rating >= 7) return "border-green-400";
  if (rating >= 5) return "border-yellow-400";
  return "border-red-400";
}

export function truncate(text: string, length: number): string {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "...";
}
