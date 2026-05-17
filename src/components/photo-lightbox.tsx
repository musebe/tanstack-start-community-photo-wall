import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { formatDate, formatBytes } from "../lib/utils";
import { CLOUDINARY_TRANSFORMS, isCloudinaryPhoto } from "../lib/cloudinary-url";
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
        className="island-shell flex max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Left: Image ─────────────────────────────────── */}
        <div className="relative flex-1 overflow-hidden bg-black">
          {/*
            Blurred copy fills the space behind the sharp image so the
            container shows the photo's own colours instead of grey bars.
            Scale > 1 hides the blurred edges that would otherwise show.
          */}
          <img
            src={photo.url}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
          />

          {/* Sharp foreground */}
          <img
            src={photo.url}
            alt={photo.title}
            className="relative h-full w-full object-contain"
          />

          {/* Status pill — top-left */}
          <div className={`absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${status.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </div>

          {/* Moderation source badge — below status pill */}
          {modBadge && (
            <div className={`absolute left-4 top-12 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm ${modBadge.cls}`}>
              {modBadge.label}
            </div>
          )}

          {/* Cloudinary badge — top-right */}
          {cloudinary && (
            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">
              ☁ Cloudinary
            </div>
          )}
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
