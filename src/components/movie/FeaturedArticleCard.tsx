import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import type { Article } from "@/data/editorial";

interface FeaturedArticleCardProps {
  article: Article;
}

export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  const categoryColors: Record<string, string> = {
    news: "bg-blue-500",
    review: "bg-purple-500",
    interview: "bg-emerald-500",
    feature: "bg-amber-500",
  };

  return (
    <Link href={`/${article.category === "review" ? "reviews" : article.category === "interview" ? "interviews" : article.category === "feature" ? "features" : "news"}`}>
      <div className="group bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all backdrop-blur-sm">
        <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <span className="text-4xl text-gray-700">🎬</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full text-white ${
                categoryColors[article.category] || "bg-gray-600"
              }`}
            >
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {article.readTime}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{article.author}</span>
            <ArrowRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </Link>
  );
}
