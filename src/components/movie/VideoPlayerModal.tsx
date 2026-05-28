"use client";

import { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { X, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface VideoPlayerItem {
  key: string;
  title: string;
  category: string;
}

interface VideoPlayerModalProps {
  videoKey: string | null;
  title: string;
  videos?: VideoPlayerItem[];
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  trailer: "TRAILERS",
  teaser: "TEASERS",
  song: "SONGS",
  review: "REVIEWS",
  miscellaneous: "MISC",
};

function formatDuration(category: string) {
  return CATEGORY_LABELS[category] || category.toUpperCase();
}

export function VideoPlayerModal({ videoKey, title, videos = [], onClose }: VideoPlayerModalProps) {
  const [activeKey, setActiveKey] = useState(videoKey);

  useEffect(() => {
    setActiveKey(videoKey);
  }, [videoKey]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (activeKey) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeKey, handleKeyDown]);

  const activeVideo = videos.find((v) => v.key === activeKey);
  const activeTitle = activeVideo?.title || title;
  const sidebarVideos = videos.filter((v) => v.key !== activeKey);

  const groupedSidebar: { category: string; label: string; items: VideoPlayerItem[] }[] = [];
  for (const video of sidebarVideos) {
    const existing = groupedSidebar.find((g) => g.category === video.category);
    if (existing) {
      existing.items.push(video);
    } else {
      groupedSidebar.push({
        category: video.category,
        label: formatDuration(video.category),
        items: [video],
      });
    }
  }

  return (
    <AnimatePresence>
      {activeKey && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative flex w-[96vw] max-w-[1400px] max-h-[92vh] flex-col lg:flex-row gap-0 overflow-hidden rounded-xl bg-[#0f0f0f]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 transition hover:bg-black/80 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left: Video player + info */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Player */}
              <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  key={activeKey}
                  src={`https://www.youtube.com/embed/${activeKey}?autoplay=1&rel=0&modestbranding=1`}
                  title={activeTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>

              {/* Video info below player */}
              <div className="px-5 py-4">
                <h3 className="text-base font-semibold text-white leading-snug line-clamp-2">
                  {activeTitle}
                </h3>
                {activeVideo && (
                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-red-500">
                    {formatDuration(activeVideo.category)}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Video sidebar */}
            {sidebarVideos.length > 0 && (
              <div className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 overflow-y-auto max-h-[30vh] lg:max-h-none">
                <div className="p-3">
                  {groupedSidebar.map((group) => (
                    <div key={group.category} className="mb-1">
                      <p className="px-2 py-2 text-[11px] font-bold uppercase tracking-widest text-red-500">
                        {group.label}
                      </p>
                      {group.items.map((video) => (
                        <button
                          key={video.key}
                          type="button"
                          onClick={() => setActiveKey(video.key)}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/5"
                        >
                          <div className="relative h-[52px] w-[92px] flex-shrink-0 overflow-hidden rounded-md bg-black">
                            <Image
                              src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                              alt={video.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="h-5 w-5 text-white/80 drop-shadow-lg" />
                            </div>
                          </div>
                          <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white/90">
                            {video.title}
                          </p>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
