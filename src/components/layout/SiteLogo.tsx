import { Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  priority?: boolean;
  variant?: "sidebar" | "nav" | "footer" | "drawer";
}

const variantStyles = {
  sidebar: {
    wrapper: "gap-4",
    iconBox: "h-12 w-12 rounded-2xl",
    icon: "h-5 w-5",
    title: "text-[2.15rem]",
    subtitle: "text-[0.72rem] tracking-[0.24em]",
  },
  nav: {
    wrapper: "gap-3",
    iconBox: "h-10 w-10 rounded-xl",
    icon: "h-[18px] w-[18px]",
    title: "text-[1.6rem]",
    subtitle: "text-[0.62rem] tracking-[0.22em]",
  },
  footer: {
    wrapper: "gap-3",
    iconBox: "h-11 w-11 rounded-xl",
    icon: "h-[18px] w-[18px]",
    title: "text-[1.75rem]",
    subtitle: "text-[0.66rem] tracking-[0.24em]",
  },
  drawer: {
    wrapper: "gap-4",
    iconBox: "h-12 w-12 rounded-2xl",
    icon: "h-5 w-5",
    title: "text-[1.95rem]",
    subtitle: "text-[0.72rem] tracking-[0.24em]",
  },
} as const;

export function SiteLogo({
  className,
  priority: _priority = false,
  variant = "nav",
}: SiteLogoProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn("flex items-center", styles.wrapper, className)}>
      <div
        className={cn(
          "flex items-center justify-center bg-[var(--color-accent)] text-[var(--color-bg)] shadow-[0_14px_30px_rgba(194,154,98,0.18)]",
          styles.iconBox
        )}
      >
        <Clapperboard className={styles.icon} strokeWidth={2} />
      </div>

      <div className="min-w-0">
        <div className={cn(
          "font-[family-name:var(--font-heading)] font-extrabold uppercase leading-none tracking-[-0.04em] text-[var(--color-accent)]",
          styles.title
        )}>
          TCU
        </div>
        <div
          className={cn(
            "mt-1 font-[family-name:var(--font-body)] font-medium uppercase text-[var(--color-muted)]",
            styles.subtitle
          )}
        >
          Cinematic Curator
        </div>
      </div>
    </div>
  );
}
