import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

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
            <div className="mb-4">
              <Logo size={32} showLabel={true} linkTo="" />
            </div>
            <p className="text-sm text-gray-500">
              Your destination for Telugu, Hindi, Tamil, Kannada &amp; Malayalam cinema updates.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Languages</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/movies/telugu" className="hover:text-cyan-400 transition-colors">Telugu</Link></li>
              <li><Link href="/movies/hindi" className="hover:text-cyan-400 transition-colors">Hindi</Link></li>
              <li><Link href="/movies/tamil" className="hover:text-cyan-400 transition-colors">Tamil</Link></li>
              <li><Link href="/movies/kannada" className="hover:text-cyan-400 transition-colors">Kannada</Link></li>
              <li><Link href="/movies/malayalam" className="hover:text-cyan-400 transition-colors">Malayalam</Link></li>
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
          &copy; {new Date().getFullYear()} TCU - Telugu Cinema Updates. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
