import { formatDate } from "../lib/utils";
import { getGalleryUrl, isCloudinaryPhoto } from "../lib/cloudinary-url";
import type { Photo, PhotoStatus } from "../types/photo";

interface PhotoCardProps {
  photo: Photo;
  onSelect: (photo: Photo) => void;
}

/** Color classes for the status pill overlaid on the image */
const STATUS_STYLES: Record<PhotoStatus, string> = {
  approved: "bg-emerald-500/90 text-white",
  pending:  "bg-amber-500/90 text-white",
  rejected: "bg-red-500/90 text-white",
};

/** Short labels shown as hover chips to make Cloudinary transforms visible */
const TRANSFORM_CHIPS = [
  "↔ 800×800",
  "👤 Face crop",
  "💧 Watermarked",
  "⚡ Auto WebP",
];

/**
 * Full-bleed photo card with a gradient overlay.
 *
 * - Status pill overlaid top-left on the image.
 * - "☁ Cloudinary" badge top-right for processed photos.
 * - Transformation chips slide up from the bottom on hover.
 * - Clicking the card opens the lightbox via `onSelect`.
 */
export function PhotoCard({ photo, onSelect }: PhotoCardProps) {
  const cloudinary = isCloudinaryPhoto(photo.publicId);
  const src = getGalleryUrl(photo.publicId, photo.url);

  return (
    <article
      className="group relative aspect-4/5 cursor-pointer overflow-hidden rounded-2xl border border-(--line) shadow-[0_4px_24px_rgba(23,58,64,0.14)] transition-shadow hover:shadow-[0_8px_32px_rgba(23,58,64,0.22)]"
      onClick={() => onSelect(photo)}
      role="button"
      tabIndex={0}
      aria-label={`Open ${photo.title}`}
      onKeyDown={(e) => e.key === "Enter" && onSelect(photo)}
    >
      {/* Image */}
      <img
        src={src}
        alt={photo.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Top gradient for badge readability */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-transparent" />

      {/* Bottom gradient for title readability */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />

      {/* Status pill — top-left */}
      <div className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLES[photo.status]}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
        {photo.status}
      </div>

      {/* Cloudinary badge — top-right */}
      {cloudinary && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          ☁ Cloudinary
        </div>
      )}

      {/* Moderation source badge — bottom-left below status */}
      {photo.moderationSource && (
        <div className="absolute left-3 top-10">
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
            photo.moderationSource === "webpurify"
              ? "bg-sky-500/80 text-white"
              : "bg-violet-500/80 text-white"
          }`}>
            {photo.moderationSource === "webpurify" ? "🤖 WebPurify" : "👤 Human"}
          </span>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="mb-0.5 line-clamp-2 text-sm font-semibold leading-snug text-white">
          {photo.title}
        </p>
        <p className="text-xs text-white/60">{formatDate(photo.createdAt)}</p>

        {/* Transformation chips — slide up on hover */}
        {cloudinary && (
          <div className="mt-2 flex flex-wrap gap-1 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            {TRANSFORM_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* "Click to expand" hint */}
        <p className="mt-2 text-[10px] text-white/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Click to expand
        </p>
      </div>
    </article>
  );
}
