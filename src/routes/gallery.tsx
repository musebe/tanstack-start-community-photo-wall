import { createFileRoute, Link } from "@tanstack/react-router";
import { PhotoWall } from "../components/photo-wall";
import { Button } from "../components/ui/button";
import { getApprovedPhotosAction } from "../actions/photos.action";

export const Route = createFileRoute("/gallery")({
  loader: () => getApprovedPhotosAction(),
  component: GalleryPage,
});

function GalleryPage() {
  const photos = Route.useLoaderData();

  return (
    <main className="page-wrap px-4 pb-20 pt-14">

      {/* Header */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="island-kicker">Community Gallery</p>
            {/* Cloudinary "powered by" pill */}
            <span className="flex items-center gap-1 rounded-full border border-(--line) bg-(--surface) px-2.5 py-0.5 text-[11px] font-medium text-(--sea-ink-soft)">
              ☁ Powered by Cloudinary
            </span>
          </div>
          <h1 className="display-title text-3xl font-bold tracking-tight text-(--sea-ink) sm:text-4xl">
            Photo Wall
          </h1>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            {photos.length === 0
              ? "No approved photos yet — be the first to submit one."
              : `${photos.length} ${photos.length === 1 ? "photo" : "photos"} — all resized, watermarked, and face-cropped by Cloudinary`}
          </p>
        </div>

        <Button asChild variant="outline" className="shrink-0">
          <Link to="/upload">+ Submit a Photo</Link>
        </Button>
      </div>

      {/* Legend */}
      {photos.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-(--line) bg-(--surface) px-4 py-2.5">
          <span className="text-xs font-medium text-(--sea-ink-soft)">Card legend:</span>
          {[
            { dot: "bg-emerald-500", label: "Approved" },
            { dot: "bg-amber-500", label: "Pending" },
            { dot: "bg-red-500", label: "Rejected" },
          ].map(({ dot, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-(--sea-ink-soft)">
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              {label}
            </span>
          ))}
          <span className="ml-auto text-xs text-(--sea-ink-soft)">
            Hover a card to see Cloudinary transforms ↗
          </span>
        </div>
      )}

      <PhotoWall
        photos={photos}
        emptyMessage="The gallery is empty — no approved photos yet."
      />
    </main>
  );
}
