import { NewsList } from "@/components/news/NewsList";
import { getTeluguNews } from "@/services/telugu-news";

export const metadata = { title: "News - Telugu Cinema Updates" };
export const revalidate = 1800;

export default async function NewsPage() {
  const items = await getTeluguNews("news", 36);
  return <NewsList title="Latest News" items={items} />;
}
