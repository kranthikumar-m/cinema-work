"use client";

import { useEffect, useRef, useState } from "react";
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
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);

  // Preview shows a single desktop row; the last tile opens the full lightbox.
  const list = activeTab === "backdrops" ? backdrops : posters;
  const previewCount = activeTab === "backdrops" ? 4 : 6;
  const visible = list.slice(0, previewCount);
  const hasMore = list.length > previewCount;
  const hiddenCount = list.length - previewCount;
  const isLandscapeTab = activeTab === "backdrops";

  // Keyboard nav + scroll lock while the lightbox is open.
  useEffect(() => {
    if (selected === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
      else if (e.key === "ArrowLeft") setSelected((s) => (s !== null && s > 0 ? s - 1 : s));
      else if (e.key === "ArrowRight")
        setSelected((s) => (s !== null && s < list.length - 1 ? s + 1 : s));
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected, list.length]);

  // Keep the active thumbnail visible in the strip.
  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!backdrops.length && !posters.length) return null;

  return (
    <>
      {backdrops.length > 0 && posters.length > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab("backdrops"); setSelected(null); }}
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
            onClick={() => { setActiveTab("posters"); setSelected(null); }}
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
          const isShowAll = hasMore && i === previewCount - 1;
          return (
            <button
              key={item.thumbnailUrl}
              onClick={() => setSelected(i)}
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

      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-10"
            onClick={() => setSelected(null)}
          >
            {/* Counter + close (on the dimmed backdrop, clearly visible) */}
            <span className="absolute left-5 top-5 z-20 text-sm font-medium text-white/70">
              {selected + 1} / {list.length}
            </span>
            <button
              onClick={() => setSelected(null)}
              className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/90 transition hover:bg-black/80 hover:text-white"
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </button>

            <div
              className="relative flex h-[85vh] w-full max-w-[1500px] items-stretch gap-3 sm:gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Main image with edge-hover navigation */}
              <div className="relative flex min-w-0 flex-1 items-center justify-center">
                <Image
                  key={list[selected].fullUrl}
                  src={list[selected].fullUrl}
                  alt={list[selected].label || `${title} photo ${selected + 1}`}
                  fill
                  className="object-contain"
                  unoptimized
                />

                {selected > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(selected - 1);
                    }}
                    aria-label="Previous image"
                    className="group/nav absolute left-0 top-0 flex h-full w-1/5 items-center justify-start pl-2 sm:pl-5"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-all duration-200 group-hover/nav:bg-black/45 group-hover/nav:opacity-100">
                      <ChevronLeft className="h-7 w-7" />
                    </span>
                  </button>
                )}
                {selected < list.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(selected + 1);
                    }}
                    aria-label="Next image"
                    className="group/nav absolute right-0 top-0 flex h-full w-1/5 items-center justify-end pr-2 sm:pr-5"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-all duration-200 group-hover/nav:bg-black/45 group-hover/nav:opacity-100">
                      <ChevronRight className="h-7 w-7" />
                    </span>
                  </button>
                )}
              </div>

              {/* Thumbnail selection strip */}
              <div className="h-full w-[76px] shrink-0 overflow-y-auto pr-1 sm:w-[104px] [scrollbar-width:thin]">
                <div className="flex flex-col gap-2">
                  {list.map((item, idx) => (
                    <button
                      key={item.thumbnailUrl}
                      ref={idx === selected ? activeThumbRef : null}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(idx);
                      }}
                      className={`relative overflow-hidden rounded-md transition ${
                        isLandscapeTab ? "aspect-video" : "aspect-[2/3]"
                      } ${
                        idx === selected
                          ? "ring-2 ring-cyan-400"
                          : "opacity-55 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.label || `${title} thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
