import { NewsList } from "@/components/news/NewsList";
import { getTeluguNews } from "@/services/telugu-news";

export const metadata = { title: "Reviews - Telugu Cinema Updates" };
export const revalidate = 1800;

export default async function ReviewsPage() {
  const items = await getTeluguNews("review", 36);
  return <NewsList title="Movie Reviews" items={items} />;
}
