import { NewsList } from "@/components/news/NewsList";
import { getTeluguNews } from "@/services/telugu-news";

export const metadata = { title: "Interviews - Telugu Cinema Updates" };
export const revalidate = 1800;

export default async function InterviewsPage() {
  const items = await getTeluguNews("interview", 36);
  return <NewsList title="Interviews" items={items} />;
}
