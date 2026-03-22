import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Width and height in pixels */
  size?: number;
  /** Show "TCU" text label next to logo */
  showLabel?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Link to homepage */
  linkTo?: string;
  /** Label text size class */
  labelClass?: string;
}

function LogoImage({ size, className }: { size: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="TCU - Telugu Cinema Updates"
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      priority
    />
  );
}

export function Logo({
  size = 40,
  showLabel = true,
  className,
  linkTo = "/",
  labelClass = "text-sm font-bold text-cyan-400",
}: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoImage size={size} />
      {showLabel && <span className={labelClass}>TCU</span>}
    </div>
  );

  if (linkTo) {
    return <Link href={linkTo}>{content}</Link>;
  }

  return content;
}
