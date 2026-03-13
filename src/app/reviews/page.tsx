import { articles, getArticlesByCategory } from "@/data/editorial";
import { ArticleList } from "@/components/shared/ArticleList";

export const metadata = { title: "Reviews - Cinemax" };

export default function ReviewsPage() {
  const reviewArticles = getArticlesByCategory("review");
  const allArticles = reviewArticles.length > 0 ? reviewArticles : articles;

  return <ArticleList title="Movie Reviews" articles={allArticles} />;
}
