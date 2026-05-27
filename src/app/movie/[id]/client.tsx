"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayerModal } from "@/components/movie/VideoPlayerModal";
import type { VideoPlayerItem } from "@/components/movie/VideoPlayerModal";

interface MovieDetailClientProps {
  trailerKey: string | null;
  videos?: VideoPlayerItem[];
}

export function MovieDetailClient({ trailerKey, videos = [] }: MovieDetailClientProps) {
  const [showTrailer, setShowTrailer] = useState(false);

  return (
    <>
      {trailerKey && (
        <Button onClick={() => setShowTrailer(true)} size="lg">
          <Play className="w-4 h-4 mr-2 fill-current" />
          Watch Trailer
        </Button>
      )}
      <VideoPlayerModal
        videoKey={showTrailer ? trailerKey : null}
        title="Trailer"
        videos={videos}
        onClose={() => setShowTrailer(false)}
      />
    </>
  );
}
