import Link from "next/link";
import { Clock, ArrowRight, Film } from "lucide-react";
import type { Article } from "@/data/editorial";

interface FeaturedArticleCardProps {
  article: Article;
}

export function FeaturedArticleCard({ article }: FeaturedArticleCardProps) {
  const categoryColors: Record<string, string> = {
    news: "bg-[rgba(194,154,98,0.88)] text-[var(--color-accent-contrast)]",
    review: "bg-[rgba(182,141,87,0.88)] text-[var(--color-accent-contrast)]",
    interview: "bg-[rgba(151,119,80,0.88)] text-[#f9efe3]",
    feature: "bg-[rgba(214,180,129,0.88)] text-[var(--color-accent-contrast)]",
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
      <div className="group overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(39,44,64,0.92)_0%,rgba(29,34,51,0.9)_100%)] transition-all hover:border-[rgba(194,154,98,0.3)]">
        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-[rgba(17,22,35,0.9)] to-[rgba(34,40,59,0.96)]">
          <Film className="h-10 w-10 text-[rgba(194,154,98,0.28)]" />
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                categoryColors[article.category] || "bg-gray-600"
              }`}
            >
              {article.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-[var(--color-muted-strong)]">
              <Clock className="h-3 w-3" />
              {article.readTime}
            </span>
          </div>
          <h3 className="mb-1 line-clamp-2 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-accent)]">
            {article.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-xs text-[var(--color-muted-strong)]">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-muted)]">{article.author}</span>
            <ArrowRight className="h-4 w-4 text-[var(--color-accent)] opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
      </div>
    </Link>
  );
}
