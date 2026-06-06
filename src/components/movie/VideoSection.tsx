"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Play } from "lucide-react";
import { VideoPlayerModal } from "@/components/movie/VideoPlayerModal";
import { VideoAdminMenu } from "@/components/movie/VideoAdminControls";
import { useOptionalAuthUser } from "@/components/auth/AuthUserProvider";

export interface VideoItem {
  key: string;
  title: string;
  category: string;
  source: "tmdb" | "custom";
  /** Set when backed by an admin-added custom row (enables in-place delete). */
  recordId?: number | null;
}

interface VideoSectionProps {
  videos: VideoItem[];
  movieId: number;
  movieTitle: string;
}

const CATEGORY_ORDER = ["trailer", "teaser", "song", "review", "miscellaneous"];
const CATEGORY_LABELS: Record<string, string> = {
  trailer: "Trailers",
  teaser: "Teasers",
  song: "Songs",
  review: "Reviews",
  miscellaneous: "Miscellaneous",
};

function VideoCard({ video, onPlay }: { video: VideoItem; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group relative w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.48)] transition hover:border-[rgba(194,154,98,0.32)]"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
          alt={video.title}
          fill
          className="object-cover transition group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-contrast)]">
            <Play className="h-6 w-6 fill-current" />
          </div>
        </div>
      </div>
      <div className="p-3 text-left">
        <p className="line-clamp-2 text-sm font-medium text-[var(--color-text)]">{video.title}</p>
      </div>
    </button>
  );
}

export function VideoSection({ videos, movieId, movieTitle }: VideoSectionProps) {
  const auth = useOptionalAuthUser();
  const isAdmin = auth?.user?.role === "admin";

  const categorized = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      items: videos.filter((v) => v.category === cat),
    }))
    .filter((group) => group.items.length > 0);

  const allCategories = [{ category: "all", label: "All", items: videos }, ...categorized];

  // Default to Trailers (when any exist). A `?videos=<category>` deep link (e.g.
  // the home hero's Audio button → `?videos=song`) opens that category instead.
  const searchParams = useSearchParams();
  const defaultTab = allCategories.some((g) => g.category === "trailer")
    ? "trailer"
    : "all";
  const requestedTab = searchParams.get("videos");
  const initialTab =
    requestedTab && allCategories.some((g) => g.category === requestedTab)
      ? requestedTab
      : defaultTab;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);

  const activeGroup = allCategories.find((g) => g.category === activeTab) ?? allCategories[0];

  const handleClose = useCallback(() => setPlayingVideo(null), []);

  if (!videos.length) return null;

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {allCategories.map((group) => (
          <button
            key={group.category}
            type="button"
            onClick={() => setActiveTab(group.category)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === group.category
                ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                : "border border-[var(--color-border)] bg-transparent text-[var(--color-muted-strong)] hover:border-[rgba(194,154,98,0.32)] hover:text-[var(--color-text)]"
            }`}
          >
            {group.label} ({group.items.length})
          </button>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {activeGroup.items.map((video) => (
          <div key={video.key} className="group relative">
            <VideoCard video={video} onPlay={() => setPlayingVideo(video)} />
            {isAdmin && (
              <VideoAdminMenu
                movieId={movieId}
                movieTitle={movieTitle}
                videoKey={video.key}
                videoTitle={video.title}
                category={video.category}
                recordId={video.recordId}
              />
            )}
          </div>
        ))}
      </div>

      <VideoPlayerModal
        videoKey={playingVideo?.key ?? null}
        title={playingVideo?.title ?? ""}
        videos={videos}
        onClose={handleClose}
      />
    </>
  );
}
