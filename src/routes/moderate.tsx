import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getAllPhotosAction } from "../actions/photos.action";
import { moderatePhotoAction } from "../actions/moderate.action";
import { refreshModerationAction } from "../actions/refresh-moderation.action";
import { formatBytes, formatDate } from "../lib/utils";
import type { Photo, PhotoStatus } from "../types/photo";

export const Route = createFileRoute("/moderate")({
  loader: () => getAllPhotosAction(),
  component: ModeratePage,
});

function ModeratePage() {
  const photos = Route.useLoaderData();
  const router = useRouter();

  const pending = photos.filter((p) => p.status === "pending");
  const approved = photos.filter((p) => p.status === "approved");
  const rejected = photos.filter((p) => p.status === "rejected");

  async function moderate(publicId: string, status: PhotoStatus) {
    await moderatePhotoAction({ data: { publicId, status } });
    await router.invalidate();
  }

  async function refreshWebPurify(publicId: string) {
    const updated = await refreshModerationAction({ data: { publicId } });
    if (updated) await router.invalidate();
    return updated;
  }

  return (
    <main className="page-wrap px-4 pb-20 pt-14">
      <div className="mb-8">
        <p className="island-kicker mb-2">Admin</p>
        <h1 className="display-title text-3xl font-bold tracking-tight text-(--sea-ink) sm:text-4xl">
          Moderation queue
        </h1>
        <p className="mt-1 text-sm text-(--sea-ink-soft)">
          {pending.length === 0
            ? "No photos waiting for review."
            : `${pending.length} photo${pending.length === 1 ? "" : "s"} awaiting review.`}
        </p>

        {/* Source badge legend */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-(--sea-ink-soft)">Badges:</span>
          <Badge variant="webpurify-pending">🤖 WebPurify analyzing</Badge>
          <Badge variant="webpurify-approved">🤖 WebPurify approved</Badge>
          <Badge variant="webpurify-rejected">🤖 WebPurify rejected</Badge>
          <Badge variant="human">👤 Human reviewed</Badge>
        </div>
      </div>

      {pending.length > 0 && (
        <Section title="Pending review" count={pending.length} accent="amber">
          {pending.map((photo) => (
            <PhotoRow
              key={photo.id}
              photo={photo}
              onModerate={moderate}
              onRefreshWebPurify={refreshWebPurify}
            />
          ))}
        </Section>
      )}

      {approved.length > 0 && (
        <Section title="Approved" count={approved.length} accent="emerald">
          {approved.map((photo) => (
            <PhotoRow
              key={photo.id}
              photo={photo}
              onModerate={moderate}
              onRefreshWebPurify={refreshWebPurify}
            />
          ))}
        </Section>
      )}

      {rejected.length > 0 && (
        <Section title="Rejected" count={rejected.length} accent="red">
          {rejected.map((photo) => (
            <PhotoRow
              key={photo.id}
              photo={photo}
              onModerate={moderate}
              onRefreshWebPurify={refreshWebPurify}
            />
          ))}
        </Section>
      )}

      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--line) py-24 text-center">
          <span className="mb-3 text-5xl">📭</span>
          <p className="font-semibold text-(--sea-ink)">Nothing here yet</p>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">Photos appear once someone uploads.</p>
        </div>
      )}
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Badge variants                                                        */
/* ─────────────────────────────────────────────────────────────────── */

type BadgeVariant = "webpurify-pending" | "webpurify-approved" | "webpurify-rejected" | "human";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  "webpurify-pending":  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300",
  "webpurify-approved": "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  "webpurify-rejected": "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
  "human":              "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300",
};

function Badge({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${BADGE_STYLES[variant]}`}>
      {children}
    </span>
  );
}

function ModerationSourceBadge({ photo }: { photo: Photo }) {
  if (!photo.moderationSource) return null;

  if (photo.moderationSource === "human") {
    return <Badge variant="human">👤 Human reviewed</Badge>;
  }

  // webpurify source — vary by current status
  if (photo.status === "pending") {
    return <Badge variant="webpurify-pending">🤖 WebPurify analyzing…</Badge>;
  }
  if (photo.status === "approved") {
    return <Badge variant="webpurify-approved">🤖 WebPurify approved</Badge>;
  }
  return <Badge variant="webpurify-rejected">🤖 WebPurify rejected</Badge>;
}

/* ─────────────────────────────────────────────────────────────────── */
/* Section wrapper                                                       */
/* ─────────────────────────────────────────────────────────────────── */

function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent: "amber" | "emerald" | "red";
  children: React.ReactNode;
}) {
  const dotColors = { amber: "bg-amber-400", emerald: "bg-emerald-500", red: "bg-red-500" };

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColors[accent]}`} />
        <h2 className="text-sm font-semibold text-(--sea-ink)">{title}</h2>
        <span className="rounded-full border border-(--line) bg-(--surface) px-2 py-0.5 text-xs text-(--sea-ink-soft)">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Individual photo row                                                  */
/* ─────────────────────────────────────────────────────────────────── */

const STATUS_PILL: Record<PhotoStatus, string> = {
  pending:  "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  rejected: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
};

function PhotoRow({
  photo,
  onModerate,
  onRefreshWebPurify,
}: {
  photo: Photo;
  onModerate: (publicId: string, status: PhotoStatus) => Promise<void>;
  onRefreshWebPurify: (publicId: string) => Promise<Photo | null>;
}) {
  const [busy, setBusy] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  async function act(status: PhotoStatus) {
    setBusy(true);
    try {
      await onModerate(photo.publicId, status);
    } finally {
      setBusy(false);
    }
  }

  async function checkWebPurify() {
    setBusy(true);
    setRefreshMsg(null);
    try {
      const updated = await onRefreshWebPurify(photo.publicId);
      if (!updated) {
        setRefreshMsg("⏳ WebPurify is still processing — check back in a few seconds.");
      }
      // If updated, router.invalidate() was called — page re-renders with new status
    } catch {
      setRefreshMsg("Could not fetch status. Check server logs.");
    } finally {
      setBusy(false);
    }
  }

  const savings =
    photo.originalSize && photo.processedSize
      ? Math.round((1 - photo.processedSize / photo.originalSize) * 100)
      : null;

  const showCheckButton =
    photo.moderationSource === "webpurify" && photo.status === "pending";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-(--line) bg-(--surface) p-4 sm:flex-row sm:items-start">
      {/* Thumbnail */}
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/5">
        <img src={photo.url} alt={photo.title} className="h-full w-full object-cover" loading="lazy" />
      </div>

      {/* Meta */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-(--sea-ink)">{photo.title}</p>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_PILL[photo.status]}`}>
            {photo.status}
          </span>
          <ModerationSourceBadge photo={photo} />
        </div>

        <p className="text-xs text-(--sea-ink-soft)">{formatDate(photo.createdAt)}</p>

        <div className="flex flex-wrap gap-3 text-[11px] text-(--sea-ink-soft)">
          <span>{photo.width}×{photo.height}px</span>
          <span>{formatBytes(photo.processedSize)}</span>
          {savings !== null && (
            <span className="text-emerald-600 dark:text-emerald-400">{savings}% smaller via Cloudinary</span>
          )}
        </div>

        {/* Context note */}
        {showCheckButton && (
          <p className="text-[11px] text-sky-600 dark:text-sky-400">
            WebPurify is analyzing this image asynchronously — click "Check status" to poll
            Cloudinary's Admin API, or override manually with the buttons below.
          </p>
        )}
        {photo.moderationSource === "human" && (
          <p className="text-[11px] text-violet-600 dark:text-violet-400">
            Manually reviewed — overrides any prior WebPurify decision.
          </p>
        )}

        {refreshMsg && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">{refreshMsg}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {/* WebPurify poll button — only for pending WebPurify photos */}
        {showCheckButton && (
          <button
            onClick={checkWebPurify}
            disabled={busy}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-50 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300"
          >
            {busy ? "Checking…" : "🤖 Check status"}
          </button>
        )}

        {photo.status !== "approved" && (
          <button
            onClick={() => act("approved")}
            disabled={busy}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
          >
            {busy ? "…" : "✓ Approve"}
          </button>
        )}
        {photo.status !== "rejected" && (
          <button
            onClick={() => act("rejected")}
            disabled={busy}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            {busy ? "…" : "✕ Reject"}
          </button>
        )}
        {photo.status !== "pending" && (
          <button
            onClick={() => act("pending")}
            disabled={busy}
            className="rounded-lg border border-(--line) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--sea-ink-soft) transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
          >
            {busy ? "…" : "↩ Reset"}
          </button>
        )}
      </div>
    </div>
  );
}
