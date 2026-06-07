import { SectionHeader } from "@/components/shared/SectionHeader";
import { NewsCard } from "@/components/news/NewsCard";
import type { NewsItem } from "@/services/telugu-news";

interface NewsListProps {
  title: string;
  items: NewsItem[];
  emptyMessage?: string;
}

export function NewsList({ title, items, emptyMessage }: NewsListProps) {
  return (
    <div className="app-page-shell py-8">
      <SectionHeader title={title} />
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-[var(--color-muted)]">
          <p>{emptyMessage || "Couldn't load stories right now. Please check back soon."}</p>
        </div>
      )}
    </div>
  );
}
