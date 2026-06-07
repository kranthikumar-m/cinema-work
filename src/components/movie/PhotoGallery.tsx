"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import type { MovieImage } from "@/types/tmdb";

export interface GalleryImage {
  thumbnailUrl: string;
  fullUrl: string;
  label?: string;
  aspectRatio?: number;
}

interface PhotoGalleryProps {
  images: MovieImage[];
  posterImages?: MovieImage[];
  title: string;
  extraImages?: GalleryImage[];
}

type Tab = "backdrops" | "posters";

function toGalleryImage(img: MovieImage): GalleryImage {
  return {
    thumbnailUrl: getImageUrl(img.file_path, "w500"),
    fullUrl: getImageUrl(img.file_path, "original"),
    aspectRatio: img.aspect_ratio || 16 / 9,
  };
}

function isLandscape(item: GalleryImage) {
  return (item.aspectRatio ?? 16 / 9) >= 1;
}

export function PhotoGallery({ images, posterImages, title, extraImages }: PhotoGalleryProps) {
  const allItems: GalleryImage[] = [
    ...(extraImages ?? []),
    ...images.map(toGalleryImage),
    ...(posterImages ?? []).map(toGalleryImage),
  ];

  const backdrops = allItems.filter((item) => isLandscape(item));
  const posters = allItems.filter((item) => !isLandscape(item));

  const defaultTab: Tab = backdrops.length > 0 ? "backdrops" : "posters";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [selected, setSelected] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Collapsed view shows a single desktop row; the last tile reveals the rest.
  const list = activeTab === "backdrops" ? backdrops : posters;
  const previewCount = activeTab === "backdrops" ? 4 : 6;
  const collapsed = !expanded && list.length > previewCount;
  const visible = collapsed ? list.slice(0, previewCount) : list.slice(0, 40);
  const hiddenCount = list.length - previewCount;

  if (!backdrops.length && !posters.length) return null;

  return (
    <>
      {backdrops.length > 0 && posters.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab("backdrops"); setSelected(null); setExpanded(false); }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === "backdrops"
                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                : "border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500"
            }`}
          >
            Backdrops ({backdrops.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("posters"); setSelected(null); setExpanded(false); }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === "posters"
                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                : "border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500"
            }`}
          >
            Posters ({posters.length})
          </button>
        </div>
      )}

      <div
        className={
          activeTab === "backdrops"
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
            : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
        }
      >
        {visible.map((item, i) => {
          const isShowAll = collapsed && i === previewCount - 1 && hiddenCount > 0;
          return (
            <button
              key={item.thumbnailUrl}
              onClick={() => (isShowAll ? setExpanded(true) : setSelected(i))}
              className={`relative overflow-hidden rounded-lg group ${
                activeTab === "backdrops" ? "aspect-video" : "aspect-[2/3]"
              }`}
            >
              <Image
                src={item.thumbnailUrl}
                alt={item.label || `${title} photo ${i + 1}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
              {item.label && !isShowAll && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {item.label}
                </span>
              )}
              {isShowAll ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/65 text-white transition-colors group-hover:bg-black/75">
                  <Images className="h-6 w-6" />
                  <span className="text-sm font-semibold">Show all ({hiddenCount})</span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              )}
            </button>
          );
        })}
      </div>

      {expanded && list.length > previewCount && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-4 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
        >
          Show less
        </button>
      )}

      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            onClick={() => setSelected(null)}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-white hover:text-cyan-400 z-10"
              aria-label="Close gallery"
            >
              <X className="w-8 h-8" />
            </button>
            {selected > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(selected - 1);
                }}
                className="absolute left-4 text-white hover:text-cyan-400 z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {selected < visible.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(selected + 1);
                }}
                className="absolute right-4 text-white hover:text-cyan-400 z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
            <div
              className={`relative w-full mx-4 ${
                activeTab === "backdrops"
                  ? "max-w-5xl aspect-video"
                  : "max-w-md aspect-[2/3]"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={visible[selected].fullUrl}
                alt={visible[selected].label || `${title} photo ${selected + 1}`}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
