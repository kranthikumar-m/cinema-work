import { Suspense } from "react";
import { getGalleryWall } from "@/services/gallery";
import { GalleryMasonry } from "@/components/gallery/GalleryMasonry";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = { title: "Gallery - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const items = await getGalleryWall();

  return (
    <div className="app-page-shell py-8">
      <SectionHeader title="Gallery" />
      <p className="-mt-3 mb-5 text-sm text-[var(--color-muted-strong)]">
        Stills and posters from the latest and upcoming Telugu films. Open any image for the full-size view.
      </p>
      {items.length ? (
        <Suspense fallback={null}>
          <GalleryMasonry items={items} />
        </Suspense>
      ) : (
        <p className="py-16 text-center text-sm text-[var(--color-muted)]">
          The gallery is still loading. Please refresh in a moment.
        </p>
      )}
    </div>
  );
}
