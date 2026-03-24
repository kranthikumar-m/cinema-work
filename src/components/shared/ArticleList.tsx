import { FeaturedArticleCard } from "@/components/movie/FeaturedArticleCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { Article } from "@/data/editorial";

interface ArticleListProps {
  title: string;
  articles: Article[];
  emptyMessage?: string;
}

export function ArticleList({ title, articles, emptyMessage }: ArticleListProps) {
  return (
    <div className="app-page-shell py-8">
      <SectionHeader title={title} />
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <FeaturedArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p>{emptyMessage || "No articles available yet. Check back soon!"}</p>
        </div>
      )}
    </div>
  );
}
