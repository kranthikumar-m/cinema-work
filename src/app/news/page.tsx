import { articles, getArticlesByCategory } from "@/data/editorial";
import { ArticleList } from "@/components/shared/ArticleList";

export const metadata = { title: "News - Cinemax" };

export default function NewsPage() {
  const newsArticles = getArticlesByCategory("news");
  const allArticles = newsArticles.length > 0 ? newsArticles : articles;

  return <ArticleList title="Latest News" articles={allArticles} />;
}
