import Link from "next/link";
import { Clock, ArrowRight, Film } from "lucide-react";
import type { Article } from "@/data/editorial";

interface FeaturedArticleCardProps {
  article: Article;
}

export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  const categoryColors: Record<string, string> = {
    news: "bg-blue-500",
    review: "bg-amber-500",
    interview: "bg-emerald-500",
    feature: "bg-cyan-500",
  };

  const href =
    article.category === "review"
      ? "/reviews"
      : article.category === "interview"
        ? "/interviews"
        : article.category === "feature"
          ? "/features"
          : "/news";

  return (
    <Link href={href}>
      <div className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60 transition-all backdrop-blur-sm hover:border-gray-700">
        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <Film className="h-10 w-10 text-gray-700" />
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase text-white ${
                categoryColors[article.category] || "bg-gray-600"
              }`}
            >
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {article.readTime}
            </span>
          </div>
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-white transition-colors group-hover:text-cyan-400">
            {article.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-xs text-gray-400">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{article.author}</span>
            <ArrowRight className="h-4 w-4 text-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
      </div>
    </Link>
  );
}
