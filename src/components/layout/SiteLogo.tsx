import Image from "next/image";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  priority?: boolean;
}

export function SiteLogo({ className, priority = false }: SiteLogoProps) {
  return (
    <Image
      src="/site-logo.png"
      alt="Telugu Cinema Updates"
      width={677}
      height={369}
      priority={priority}
      sizes="(max-width: 1024px) 160px, 220px"
      className={cn("h-auto w-full", className)}
    />
  );
}
