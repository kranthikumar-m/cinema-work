import Link from "next/link";
import { cn } from "@/lib/utils";
import { SiteLogo } from "@/components/layout/SiteLogo";

interface FooterProps {
  className?: string;
  contentClassName?: string;
}

export function Footer({
  className,
  contentClassName = "",
}: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-[var(--color-border)] bg-[var(--color-bg-deep)]",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-[1600px] px-5 py-12 md:px-8 xl:px-14",
          contentClassName
        )}
      >
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="mb-5">
              <SiteLogo variant="footer" />
            </div>
            <p className="max-w-xs text-sm leading-7 text-[var(--color-muted-strong)]">
              Telugu-first movie coverage with validated releases, trailers, stories, and release tracking powered by TMDB and Wikipedia cross-checks.
            </p>
          </div>
          <div>
            <h3 className="mb-4 font-[family-name:var(--font-heading)] text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Explore
            </h3>
            <ul className="space-y-3 text-sm text-[var(--color-muted-strong)]">
              <li><Link href="/movies/trending" className="transition-colors hover:text-[var(--color-text)]">Validated Releases</Link></li>
              <li><Link href="/movies/popular" className="transition-colors hover:text-[var(--color-text)]">Popular Telugu</Link></li>
              <li><Link href="/movies/upcoming" className="transition-colors hover:text-[var(--color-text)]">Upcoming Telugu</Link></li>
              <li><Link href="/movies/top-rated" className="transition-colors hover:text-[var(--color-text)]">Top Rated Telugu</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-[family-name:var(--font-heading)] text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Content
            </h3>
            <ul className="space-y-3 text-sm text-[var(--color-muted-strong)]">
              <li><Link href="/news" className="transition-colors hover:text-[var(--color-text)]">News</Link></li>
              <li><Link href="/reviews" className="transition-colors hover:text-[var(--color-text)]">Reviews</Link></li>
              <li><Link href="/interviews" className="transition-colors hover:text-[var(--color-text)]">Interviews</Link></li>
              <li><Link href="/features" className="transition-colors hover:text-[var(--color-text)]">Features</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-[family-name:var(--font-heading)] text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Legal
            </h3>
            <ul className="space-y-3 text-sm text-[var(--color-muted-strong)]">
              <li><span className="cursor-default">Privacy Policy</span></li>
              <li><span className="cursor-default">Terms of Service</span></li>
              <li><span className="cursor-default">Cookie Policy</span></li>
            </ul>
            <p className="mt-4 text-xs leading-6 text-[var(--color-muted)]">
              Powered by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--color-border)] pt-6 text-center text-xs text-[var(--color-muted)]">
          &copy; {new Date().getFullYear()} Telugu Cinema Updates. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
