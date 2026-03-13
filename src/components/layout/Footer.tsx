import Link from "next/link";
import { Film } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-800/50 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-10 lg:pl-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                <Film className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-cyan-400">CINEMAX</span>
            </div>
            <p className="text-sm text-gray-500">
              Your premium destination for movie discovery, reviews, and entertainment news.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Explore</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/movies/trending" className="hover:text-cyan-400 transition-colors">Trending</Link></li>
              <li><Link href="/movies/popular" className="hover:text-cyan-400 transition-colors">Popular</Link></li>
              <li><Link href="/movies/upcoming" className="hover:text-cyan-400 transition-colors">Upcoming</Link></li>
              <li><Link href="/movies/top-rated" className="hover:text-cyan-400 transition-colors">Top Rated</Link></li>
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
          &copy; {new Date().getFullYear()} Cinemax. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
