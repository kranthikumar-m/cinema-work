import Link from "next/link";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface PersonCardProps {
  id: number;
  name: string;
  profilePath: string | null;
  subtitle?: string;
  priority?: boolean;
}

/** Gapless portrait tile with the name on a bottom gradient. */
export function PersonCard({ id, name, profilePath, subtitle, priority = false }: PersonCardProps) {
  return (
    <Link
      href={`/person/${id}`}
      className="group relative block aspect-[3/4] overflow-hidden bg-[var(--color-bg-elevated)] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
    >
      {profilePath ? (
        <Image
          src={getImageUrl(profilePath, "w500")}
          alt={name}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
          className="object-cover object-top transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.04]"
          priority={priority}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
          <UserRound className="h-10 w-10" strokeWidth={1.4} />
        </div>
      )}
      <div className="tile-overlay absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-12 text-center">
        <h3 className="line-clamp-2 font-[family-name:var(--font-heading)] text-[13px] font-semibold leading-tight text-white transition-colors group-hover:text-[var(--color-accent-strong)]">
          {name}
        </h3>
        {subtitle && <p className="mt-1 truncate text-[10.5px] text-white/60">{subtitle}</p>}
      </div>
    </Link>
  );
}
