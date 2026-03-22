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
    <footer className={cn("border-t border-gray-800/50 bg-gray-950", className)}>
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 py-10 md:px-6 xl:px-8",
          contentClassName
        )}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4 w-[172px]">
              <SiteLogo variant="footer" />
            </div>
            <p className="text-sm text-gray-500">
              Telugu-first movie coverage with validated releases, trailers, stories, and release tracking powered by TMDB and Wikipedia cross-checks.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Explore</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/movies/trending" className="hover:text-cyan-400 transition-colors">Validated Releases</Link></li>
              <li><Link href="/movies/popular" className="hover:text-cyan-400 transition-colors">Popular Telugu</Link></li>
              <li><Link href="/movies/upcoming" className="hover:text-cyan-400 transition-colors">Upcoming Telugu</Link></li>
              <li><Link href="/movies/top-rated" className="hover:text-cyan-400 transition-colors">Top Rated Telugu</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Content</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/news" className="hover:text-cyan-400 transition-colors">News</Link></li>
              <li><Link href="/reviews" className="hover:text-cyan-400 transition-colors">Reviews</Link></li>
              <li><Link href="/interviews" className="hover:text-cyan-400 transition-colors">Interviews</Link></li>
              <li><Link href="/features" className="hover:text-cyan-400 transition-colors">Features</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><span className="cursor-default">Privacy Policy</span></li>
              <li><span className="cursor-default">Terms of Service</span></li>
              <li><span className="cursor-default">Cookie Policy</span></li>
            </ul>
            <p className="text-xs text-gray-600 mt-4">
              Powered by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-800/50 mt-8 pt-6 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Telugu Cinema Updates. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
