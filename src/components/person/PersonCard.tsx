import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

interface PersonCardProps {
  id: number;
  name: string;
  profilePath: string | null;
  subtitle?: string;
  priority?: boolean;
}

export function PersonCard({ id, name, profilePath, subtitle, priority = false }: PersonCardProps) {
  return (
    <Link href={`/person/${id}`} className="group block">
      <div className="relative overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-deep)] transition-transform duration-300 group-hover:scale-[1.01] group-hover:shadow-[0_18px_48px_rgba(7,10,18,0.22)]">
        <div className="relative aspect-[2/3]">
          <Image
            src={getImageUrl(profilePath, "w500")}
            alt={name}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
            className="object-cover"
            priority={priority}
            unoptimized={!profilePath}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,24,39,0.55)] via-transparent to-transparent" />
        </div>
      </div>
      <div className="mt-2 px-1">
        <h3 className="truncate font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
          {name}
        </h3>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-[var(--color-muted-strong)]">{subtitle}</p>
        )}
      </div>
    </Link>
  );
}
