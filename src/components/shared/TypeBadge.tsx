import { cn } from "@/lib/utils";

export type ContentKind =
  | "news"
  | "review"
  | "interview"
  | "feature"
  | "trailer"
  | "teaser"
  | "song"
  | "video"
  | "photo"
  | "quiz"
  | "poll";

const KIND_LABELS: Record<ContentKind, string> = {
  news: "News",
  review: "Review",
  interview: "Interview",
  feature: "Feature",
  trailer: "Trailer",
  teaser: "Teaser",
  song: "Song",
  video: "Video",
  photo: "Photo",
  quiz: "Quiz",
  poll: "Poll",
};

// One colour per content type so a mixed feed reads at a glance.
const KIND_COLORS: Record<ContentKind, string> = {
  news: "var(--badge-news)",
  review: "var(--badge-review)",
  interview: "var(--badge-interview)",
  feature: "var(--badge-feature)",
  trailer: "var(--badge-trailer)",
  teaser: "var(--badge-trailer)",
  song: "var(--badge-song)",
  video: "var(--badge-video)",
  photo: "var(--badge-photo)",
  quiz: "var(--badge-interview)",
  poll: "var(--badge-video)",
};

interface TypeBadgeProps {
  kind: ContentKind;
  label?: string;
  className?: string;
}

/** Small colour-coded label ("PHOTO", "TRAILER") with a leading tick mark. */
export function TypeBadge({ kind, label, className }: TypeBadgeProps) {
  const color = KIND_COLORS[kind];
  return (
    <span
      className={cn("eyebrow-label inline-flex items-center gap-1.5 leading-none", className)}
      style={{ color }}
    >
      <span className="inline-block h-2.5 w-[3px] rounded-sm" style={{ background: color }} />
      {label ?? KIND_LABELS[kind]}
    </span>
  );
}
