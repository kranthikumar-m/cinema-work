import { articles, getArticlesByCategory } from "@/data/editorial";
import { ArticleList } from "@/components/shared/ArticleList";

export const metadata = { title: "Features - Telugu Cinema Updates" };

export default function FeaturesPage() {
  const featureArticles = getArticlesByCategory("feature");
  const allArticles = featureArticles.length > 0 ? featureArticles : articles;

  return <ArticleList title="Features" articles={allArticles} />;
}
