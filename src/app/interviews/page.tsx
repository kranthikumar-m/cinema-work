import { articles, getArticlesByCategory } from "@/data/editorial";
import { ArticleList } from "@/components/shared/ArticleList";

export const metadata = { title: "Interviews - Cinemax" };

export default function InterviewsPage() {
  const interviewArticles = getArticlesByCategory("interview");
  const allArticles = interviewArticles.length > 0 ? interviewArticles : articles;

  return <ArticleList title="Interviews" articles={allArticles} />;
}
