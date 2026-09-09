"use client";

import { cn } from "@/lib/utils";

interface RatingRingProps {
  /** IMDb rating on a 0–10 scale, or null/undefined when none is available. */
  rating: number | null | undefined;
  size?: number;
  className?: string;
}

export function RatingRing({ rating, size = 48, className }: RatingRingProps) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const hasRating = typeof rating === "number" && rating > 0;
  const value = hasRating ? (rating as number) : 0;
  const progress = (value / 10) * circumference;
  const display = hasRating ? value.toFixed(1) : "NR";

  const color = !hasRating
    ? "rgba(123,133,158,0.5)"
    : value >= 7
      ? "#c29a62"
      : value >= 5
        ? "#d9b27f"
        : "#996d58";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="3"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn(
          "absolute font-bold",
          hasRating ? "text-white" : "text-[var(--color-muted)]"
        )}
        style={{ fontSize: size * (hasRating ? 0.26 : 0.24) }}
      >
        {display}
      </span>
    </div>
  );
}
