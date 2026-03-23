"use client";

import { cn } from "@/lib/utils";

interface RatingRingProps {
  rating: number;
  size?: number;
  className?: string;
}

export function RatingRing({ rating, size = 48, className }: RatingRingProps) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (rating / 10) * circumference;
  const display = rating.toFixed(1);

  const color =
    rating >= 7 ? "#c29a62" : rating >= 5 ? "#d9b27f" : "#996d58";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(194,154,98,0.18)"
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
        className="absolute text-xs font-bold text-white"
        style={{ fontSize: size * 0.26 }}
      >
        {display}
      </span>
    </div>
  );
}
