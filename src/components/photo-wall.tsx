import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PhotoCard } from "./photo-card";
import { PhotoLightbox } from "./photo-lightbox";
import { Button } from "./ui/button";
import type { Photo } from "../types/photo";

interface PhotoWallProps {
  photos: Photo[];
  emptyMessage?: string;
}

/**
 * Masonry-style column grid.
 * Manages lightbox state — clicking a PhotoCard opens PhotoLightbox.
 */
export function PhotoWall({
  photos,
  emptyMessage = "No approved photos yet.",
}: PhotoWallProps) {
  const [selected, setSelected] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--line) bg-(--surface) py-24 text-center">
        <span className="mb-4 text-5xl">📷</span>
        <p className="text-lg font-semibold text-(--sea-ink)">{emptyMessage}</p>
        <p className="mb-6 mt-1 text-sm text-(--sea-ink-soft)">
          Approved photos will appear here once a moderator reviews them.
        </p>
        <Button asChild variant="outline">
          <Link to="/upload">Be the first to upload</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 gap-5 sm:columns-2 md:columns-3 lg:columns-4">
        {photos.map((photo) => (
          <div key={photo.id} className="mb-5 break-inside-avoid">
            <PhotoCard photo={photo} onSelect={setSelected} />
          </div>
        ))}
      </div>

      {/* Lightbox — rendered outside the grid so it can overlay everything */}
      {selected && (
        <PhotoLightbox photo={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
