"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import type { MovieImage } from "@/types/tmdb";

interface PhotoGalleryProps {
  images: MovieImage[];
  title: string;
}

export function PhotoGallery({ images, title }: PhotoGalleryProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const visible = images.slice(0, 12);

  if (!visible.length) return null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {visible.map((img, i) => (
          <button
            key={img.file_path}
            onClick={() => setSelected(i)}
            className="relative aspect-video rounded-lg overflow-hidden group"
          >
            <Image
              src={getImageUrl(img.file_path, "w500")}
              alt={`${title} photo ${i + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              unoptimized
            />
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
                src={getImageUrl(visible[selected].file_path, "original")}
                alt={`${title} photo ${selected + 1}`}
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
