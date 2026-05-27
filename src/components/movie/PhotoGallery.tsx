"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
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
  title: string;
  extraImages?: GalleryImage[];
}

function toGalleryImage(img: MovieImage): GalleryImage {
  return {
    thumbnailUrl: getImageUrl(img.file_path, "w500"),
    fullUrl: getImageUrl(img.file_path, "original"),
    aspectRatio: img.aspect_ratio || 16 / 9,
  };
}

export function PhotoGallery({ images, title, extraImages }: PhotoGalleryProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const allItems: GalleryImage[] = [
    ...(extraImages ?? []),
    ...images.map(toGalleryImage),
  ];
  const visible = allItems.slice(0, 12);

  if (!visible.length) return null;

  return (
    <>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
        {visible.map((item, i) => (
          <button
            key={item.thumbnailUrl}
            onClick={() => setSelected(i)}
            className="relative mb-3 block w-full overflow-hidden rounded-lg group break-inside-avoid"
            style={{ aspectRatio: item.aspectRatio ?? 16 / 9 }}
          >
            <Image
              src={item.thumbnailUrl}
              alt={item.label || `${title} photo ${i + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              unoptimized
            />
            {item.label && (
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {item.label}
              </span>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
        ))}
      </div>

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
              className="relative w-full max-w-5xl mx-4 aspect-video"
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
