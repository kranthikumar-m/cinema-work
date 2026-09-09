import type { ContentKind } from "@/components/shared/TypeBadge";

export type FeedKind = Extract<
  ContentKind,
  "news" | "review" | "interview" | "feature" | "trailer" | "teaser" | "song" | "video" | "photo" | "quiz" | "poll"
>;

/** One card in the mixed homepage feed. Plain data so it can cross to the client. */
export interface FeedItem {
  id: string;
  kind: FeedKind;
  title: string;
  /** Secondary line: source name, movie title, or a short excerpt. */
  subtitle?: string | null;
  image: string | null;
  /** ISO date used for ordering and the card's date line. */
  date: string | null;
  href: string;
  external: boolean;
  movieId?: number;
  youtubeKey?: string;
  meta?: {
    views?: number | null;
    durationLabel?: string | null;
    count?: number;
  };
}
