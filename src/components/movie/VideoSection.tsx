"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface VideoItem {
  key: string;
  title: string;
  category: string;
  source: "tmdb" | "custom";
}

interface VideoSectionProps {
  videos: VideoItem[];
}

const CATEGORY_ORDER = ["trailer", "teaser", "review", "miscellaneous"];
const CATEGORY_LABELS: Record<string, string> = {
  trailer: "Trailers",
  teaser: "Teasers",
  review: "Reviews",
  miscellaneous: "Miscellaneous",
};

function VideoModal({ videoKey, title, onClose }: { videoKey: string; title: string; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-[90vw] max-w-5xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute -right-2 -top-12 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close video"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

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

export function VideoSection({ videos }: VideoSectionProps) {
  const categorized = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      items: videos.filter((v) => v.category === cat),
    }))
    .filter((group) => group.items.length > 0);

  const allCategories = [{ category: "all", label: "All", items: videos }, ...categorized];
  const [activeTab, setActiveTab] = useState("all");
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);

  const activeGroup = allCategories.find((g) => g.category === activeTab) ?? allCategories[0];

  const handleClose = useCallback(() => setPlayingVideo(null), []);

  if (!videos.length) return null;

  return (
    <>
      {categorized.length > 1 && (
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
      )}

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {activeGroup.items.map((video) => (
          <VideoCard
            key={video.key}
            video={video}
            onPlay={() => setPlayingVideo(video)}
          />
        ))}
      </div>

      {playingVideo && (
        <VideoModal
          videoKey={playingVideo.key}
          title={playingVideo.title}
          onClose={handleClose}
        />
      )}
    </>
  );
}
