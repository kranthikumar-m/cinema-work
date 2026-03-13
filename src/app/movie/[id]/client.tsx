"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrailerModal } from "@/components/movie/TrailerModal";

interface MovieDetailClientProps {
  trailerKey: string | null;
}

export function MovieDetailClient({ trailerKey }: MovieDetailClientProps) {
  const [showTrailer, setShowTrailer] = useState(false);

  return (
    <>
      {trailerKey && (
        <Button onClick={() => setShowTrailer(true)} size="lg">
          <Play className="w-4 h-4 mr-2 fill-current" />
          Watch Trailer
        </Button>
      )}
      <TrailerModal
        videoKey={showTrailer ? trailerKey : null}
        onClose={() => setShowTrailer(false)}
      />
    </>
  );
}
