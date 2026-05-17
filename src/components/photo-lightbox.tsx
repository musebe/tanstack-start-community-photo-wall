import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { formatDate, formatBytes } from "../lib/utils";
import { CLOUDINARY_TRANSFORMS, getAmbientUrl, isCloudinaryPhoto } from "../lib/cloudinary-url";
import type { Photo, PhotoStatus } from "../types/photo";

interface PhotoLightboxProps {
  photo: Photo;
  onClose: () => void;
}

const STATUS_STYLES: Record<PhotoStatus, { pill: string; dot: string; label: string }> = {
  approved: { pill: "bg-emerald-500/90 text-white", dot: "bg-white/70", label: "Approved" },
  pending:  { pill: "bg-amber-500/90  text-white", dot: "bg-white/70", label: "Pending"  },
  rejected: { pill: "bg-red-500/90    text-white", dot: "bg-white/70", label: "Rejected" },
};

const MODERATION_BADGE: Record<
  "webpurify" | "human",
  Record<PhotoStatus, { label: string; cls: string } | null>
> = {
  webpurify: {
    approved: { label: "🤖 Auto-approved by WebPurify", cls: "bg-sky-500/80 text-white" },
    rejected: { label: "🤖 Auto-rejected by WebPurify", cls: "bg-red-500/80 text-white" },
    pending:  { label: "🤖 WebPurify analyzing…",       cls: "bg-sky-500/80 text-white" },
  },
  human: {
    approved: { label: "👤 Human approved", cls: "bg-violet-500/80 text-white" },
    rejected: { label: "👤 Human rejected", cls: "bg-orange-500/80 text-white" },
    pending:  { label: "👤 Human reviewed", cls: "bg-violet-500/80 text-white" },
  },
};

export function PhotoLightbox({ photo, onClose }: PhotoLightboxProps) {
  const cloudinary = isCloudinaryPhoto(photo.publicId);
  const ambientUrl = getAmbientUrl(photo.publicId, photo.url);
  const status = STATUS_STYLES[photo.status];
  const modBadge = photo.moderationSource
    ? MODERATION_BADGE[photo.moderationSource][photo.status]
    : null;

  const savings =
    photo.originalSize && photo.processedSize
      ? Math.round((1 - photo.processedSize / photo.originalSize) * 100)
      : null;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
    >
      <div
        className="island-shell flex max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Left: Image + tags ──────────────────────────── */}
        <div className="flex flex-1 min-h-0 flex-col gap-3 bg-zinc-950 p-4">

          {/* Image section — ambient glow contained inside rounded frame */}
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl">
            {/*
              Ambient layer: Cloudinary delivers an 80px copy with
              e_blur:1500 + e_saturation:50 baked in (~1 KB).
              Stretched full-bleed, it fills dead space with the photo's
              own colour palette — the same trick Apple Music uses.
            */}
            <img
              src={ambientUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-150 object-cover brightness-75 saturate-150"
            />

            {/* Radial vignette — edges darken, centre glows */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,transparent_25%,rgba(0,0,0,0.55)_100%)]" />

            {/* Sharp photo — floats above the glow */}
            <img
              src={photo.url}
              alt={photo.title}
              className="relative h-full w-full object-contain drop-shadow-[0_8px_40px_rgba(0,0,0,0.75)]"
            />
          </div>

          {/* Tags row — status, moderation source, Cloudinary */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.pill}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>

            {modBadge && (
              <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold ${modBadge.cls}`}>
                {modBadge.label}
              </span>
            )}

            {cloudinary && (
              <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-white/70">
                ☁ Cloudinary
              </span>
            )}
          </div>
        </div>

        {/* ── Right: Info panel ───────────────────────────── */}
        <div className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-(--line)">

          {/* Header */}
          <div className="border-b border-(--line) p-5">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h2 className="text-base font-bold leading-snug text-(--sea-ink)">
                {photo.title}
              </h2>
              <button
                onClick={onClose}
                className="shrink-0 rounded-full p-1 text-(--sea-ink-soft) transition hover:bg-black/10 hover:text-(--sea-ink)"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-(--sea-ink-soft)">{formatDate(photo.createdAt)}</p>

            {/* Moderation provenance */}
            {modBadge && (
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${modBadge.cls}`}>
                  {modBadge.label}
                </span>
              </div>
            )}
          </div>

          {/* Cloudinary output stats */}
          {cloudinary && (
            <div className="border-b border-(--line) p-5">
              <p className="island-kicker mb-3">Cloudinary output</p>

              {savings !== null && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {savings}% smaller
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-500">
                    {formatBytes(photo.originalSize ?? 0)} original → {formatBytes(photo.processedSize)} stored
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <StatCell label="Dimensions" value={`${photo.width} × ${photo.height}`} />
                <StatCell label="Stored size" value={formatBytes(photo.processedSize)} />
                <StatCell label="Format" value="WebP" />
                <StatCell label="Crop mode" value="c_fill" />
              </div>
            </div>
          )}

          {/* Transformation checklist */}
          {cloudinary && (
            <div className="p-5">
              <p className="island-kicker mb-3">Transformations applied</p>
              <ul className="space-y-3">
                {CLOUDINARY_TRANSFORMS.map(({ label, tag, desc }) => (
                  <li key={label} className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-sm text-emerald-500">✓</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-(--sea-ink)">{label}</span>
                        <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[9px] text-(--lagoon-deep) dark:bg-white/10">
                          {tag}
                        </code>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-(--sea-ink-soft)">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!cloudinary && (
            <div className="p-5">
              <p className="text-xs text-(--sea-ink-soft)">
                This is a demo photo (Unsplash). Real uploads go through Cloudinary and will show transformation stats here.
              </p>
            </div>
          )}

          {/* Moderation link */}
          <div className="mt-auto border-t border-(--line) p-5">
            <Link
              to="/moderate"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-(--line) bg-(--surface) px-4 py-2.5 text-xs font-semibold text-(--sea-ink-soft) transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              View in moderation queue →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-(--line) bg-(--surface) p-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-(--sea-ink-soft)">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-(--sea-ink)">{value}</p>
    </div>
  );
}
