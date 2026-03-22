import Image from "next/image";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  priority?: boolean;
  variant?: "sidebar" | "nav" | "footer" | "drawer";
}

const logoSizes = {
  sidebar: "(max-width: 1024px) 112px, 132px",
  nav: "(max-width: 1024px) 110px, 128px",
  footer: "(max-width: 1024px) 168px, 196px",
  drawer: "(max-width: 1024px) 168px, 196px",
} as const;

export function SiteLogo({
  className,
  priority = false,
  variant = "nav",
}: SiteLogoProps) {
  return (
    <Image
      src="/site-logo.png"
      alt="Telugu Cinema Updates"
      width={677}
      height={369}
      priority={priority}
      sizes={logoSizes[variant]}
      className={cn("h-auto w-full object-contain", className)}
    />
  );
}
