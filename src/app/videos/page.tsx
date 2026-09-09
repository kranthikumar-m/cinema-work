import { Suspense } from "react";
import { getVideoWall } from "@/services/videos-feed";
import { VideoWall } from "@/components/video/VideoWall";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Videos & Trailers - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const items = await getVideoWall();

  return (
    <div className="app-page-shell py-8">
      <SectionHeader title="Videos" />
      <p className="-mt-3 mb-5 text-sm text-[var(--color-muted-strong)]">
        Trailers, teasers, songs, promos, interviews and event videos from the latest Telugu films.
      </p>
      {items.length ? (
        <Suspense fallback={null}>
          <VideoWall items={items} />
        </Suspense>
      ) : (
        <p className="py-16 text-center text-sm text-[var(--color-muted)]">
          Videos are still loading. Please refresh in a moment.
        </p>
      )}
    </div>
  );
}
