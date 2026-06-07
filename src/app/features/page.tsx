import { NewsList } from "@/components/news/NewsList";
import { getTeluguNews } from "@/services/telugu-news";

export const metadata = { title: "Features - Telugu Cinema Updates" };
export const revalidate = 1800;

export default async function FeaturesPage() {
  const items = await getTeluguNews("feature", 36);
  return <NewsList title="Features" items={items} />;
}
