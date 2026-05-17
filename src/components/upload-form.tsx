import React, { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import {
  validateImageFile,
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  formatBytes,
  arrayBufferToBase64,
} from "../lib/utils";
import { CLOUDINARY_TRANSFORMS } from "../lib/cloudinary-url";
import { uploadChunkAction } from "../actions/upload-chunk.action";
import type { Photo } from "../types/photo";

/* ─────────────────────────────────────────────────────────────────── */
/* Types                                                                */
/* ─────────────────────────────────────────────────────────────────── */

type StepId = "validate" | "upload" | "process" | "save";

interface ProgressStep {
  id: StepId;
  label: string;
  detail: string;
}

const STEPS: ProgressStep[] = [
  { id: "validate", label: "Validating",   detail: "Checking file type & size"             },
  { id: "upload",   label: "Uploading",    detail: "Sending chunks to Cloudinary"          },
  { id: "process",  label: "Transforming", detail: "Resize · Face crop · Watermark · WebP" },
  { id: "save",     label: "Saving",       detail: "Storing as pending submission"          },
];

type UploadState =
  | { type: "idle" }
  | { type: "uploading"; percent: number; stepId: StepId }
  | { type: "success"; photo: Photo }
  | { type: "error"; message: string };

/* Chunk size: 1 MB. Small enough to avoid memory spikes; large enough to be fast. */
const CHUNK_SIZE = 1 * 1024 * 1024;

/* ─────────────────────────────────────────────────────────────────── */
/* Main component                                                       */
/* ─────────────────────────────────────────────────────────────────── */

export function UploadForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>({ type: "idle" });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      setState({ type: "error", message: error });
      setPreviewUrl(null);
      return;
    }
    setState({ type: "idle" });
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setState({ type: "error", message: "Please select an image to upload." });
      return;
    }
    const validationError = validateImageFile(file);
    if (validationError) {
      setState({ type: "error", message: validationError });
      return;
    }

    setState({ type: "uploading", percent: 8, stepId: "validate" });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const totalChunks = Math.max(1, Math.ceil(bytes.length / CHUNK_SIZE));
      const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      setState({ type: "uploading", percent: 12, stepId: "upload" });

      let photo: Photo | null = null;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const chunk = bytes.slice(start, start + CHUNK_SIZE);
        // Uint8Array.slice() returns a copy with its own buffer — safe to pass directly
        const chunkBase64 = arrayBufferToBase64(chunk.buffer as ArrayBuffer);

        const result = await uploadChunkAction({
          data: {
            uploadId,
            chunkIndex: i,
            totalChunks,
            chunkBase64,
            filename: file.name,
            title: title.trim() || file.name,
            originalSize: file.size,
          },
        });

        if (result !== null) {
          // Final chunk — Cloudinary is processing
          setState({ type: "uploading", percent: 90, stepId: "process" });
          photo = result;
        } else {
          // Intermediate chunk — advance progress proportionally between 12–82%
          const uploadPercent = 12 + ((i + 1) / totalChunks) * 70;
          setState({ type: "uploading", percent: uploadPercent, stepId: "upload" });
        }
      }

      if (!photo) throw new Error("Upload completed but no photo was returned.");

      setState({ type: "uploading", percent: 100, stepId: "save" });
      await new Promise<void>((r) => setTimeout(r, 400));

      setState({ type: "success", photo });
      setTitle("");
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error("[Upload] failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Upload failed — check the server terminal for details.";
      setState({ type: "error", message });
    }
  }

  function reset() {
    setState({ type: "idle" });
    setPreviewUrl(null);
    setTitle("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const isUploading = state.type === "uploading";

  return (
    <div className="island-shell rounded-2xl p-6 sm:p-8">
      {state.type === "success" ? (
        <SuccessBanner photo={state.photo} onReset={reset} />
      ) : (
        <>
          {isUploading && (
            <UploadProgress percent={state.percent} stepId={state.stepId} />
          )}

          {!isUploading && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Caption */}
              <div className="space-y-1.5">
                <label
                  htmlFor="photo-title"
                  className="block text-sm font-medium text-(--sea-ink)"
                >
                  Caption{" "}
                  <span className="text-(--sea-ink-soft)">(optional)</span>
                </label>
                <input
                  id="photo-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your photo a short title…"
                  maxLength={80}
                  className="w-full rounded-lg border border-(--line) bg-(--surface) px-3 py-2 text-sm text-(--sea-ink) outline-none placeholder:text-(--sea-ink-soft) focus:ring-2 focus:ring-(--lagoon)"
                />
              </div>

              {/* File picker */}
              <div className="space-y-1.5">
                <label
                  htmlFor="photo-file"
                  className="block text-sm font-medium text-(--sea-ink)"
                >
                  Image <span className="text-red-500">*</span>
                </label>
                <input
                  id="photo-file"
                  ref={fileRef}
                  type="file"
                  accept={ALLOWED_TYPES.join(",")}
                  onChange={handleFileChange}
                  className="w-full rounded-lg border border-(--line) bg-(--surface) px-3 py-2 text-sm text-(--sea-ink) file:mr-3 file:rounded-md file:border-0 file:bg-(--lagoon) file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                />
                <p className="text-xs text-(--sea-ink-soft)">
                  JPEG, PNG, WebP or GIF · Max {MAX_FILE_SIZE / 1024 / 1024} MB · 1 file at a time
                </p>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="relative overflow-hidden rounded-xl border border-(--line)">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 w-full object-cover"
                  />
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                    Original — untransformed
                  </span>
                </div>
              )}

              {/* Error */}
              {state.type === "error" && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {state.message}
                </p>
              )}

              <Button type="submit" className="w-full">
                Submit Photo
              </Button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Animated upload progress — driven by real chunk data                 */
/* ─────────────────────────────────────────────────────────────────── */

function UploadProgress({ percent, stepId }: { percent: number; stepId: StepId }) {
  const currentStep = STEPS.find((s) => s.id === stepId) ?? STEPS[0];

  return (
    <div className="space-y-6 py-2">
      {/* Step indicators */}
      <div className="flex items-start justify-between gap-1">
        {STEPS.map((step, i) => {
          const activeIndex = STEPS.findIndex((s) => s.id === stepId);
          const isDone = i < activeIndex;
          const isActive = step.id === stepId;
          return (
            <div key={step.id} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors duration-300 ${
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isActive
                    ? "border-(--lagoon) bg-(--lagoon)/10 text-(--lagoon)"
                    : "border-(--line) bg-(--surface) text-(--sea-ink-soft)"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                className={`text-center text-[10px] font-medium leading-tight ${
                  isActive
                    ? "text-(--lagoon)"
                    : isDone
                    ? "text-emerald-600"
                    : "text-(--sea-ink-soft)"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-linear-to-r from-(--lagoon) to-(--lagoon-deep) transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-(--sea-ink)">{currentStep.detail}</p>
          <span className="text-xs tabular-nums text-(--sea-ink-soft)">
            {Math.round(percent)}%
          </span>
        </div>
      </div>

      {/* Pulsing dots */}
      <div className="flex items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--lagoon)"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
        <span className="ml-2 text-xs text-(--sea-ink-soft)">
          Cloudinary is processing your photo…
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Success banner                                                        */
/* ─────────────────────────────────────────────────────────────────── */

function SuccessBanner({ photo, onReset }: { photo: Photo; onReset: () => void }) {
  const savings =
    photo.originalSize && photo.processedSize
      ? Math.round((1 - photo.processedSize / photo.originalSize) * 100)
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <span className="mb-2 block text-4xl">🎉</span>
        <p className="text-lg font-semibold text-(--sea-ink)">Photo submitted!</p>
        <p className="mt-1 text-sm text-(--sea-ink-soft)">
          Cloudinary processed it instantly. A moderator will review it before it appears in the
          gallery.
        </p>
      </div>

      {/* Processed image */}
      {photo.url && (
        <div className="relative overflow-hidden rounded-xl border border-(--line)">
          <img
            src={photo.url}
            alt={photo.title}
            className="max-h-56 w-full object-cover"
          />
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
            ☁ Cloudinary processed
          </span>
        </div>
      )}

      {/* Stats */}
      {savings !== null && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Processed" value={`${photo.width}×${photo.height}`} />
          <Stat
            label="File size"
            value={formatBytes(photo.processedSize)}
            sub={photo.originalSize ? `from ${formatBytes(photo.originalSize)}` : undefined}
          />
          <Stat label="Savings" value={`${savings}%`} highlight />
        </div>
      )}

      {/* Transformation checklist */}
      <div className="rounded-xl border border-(--line) bg-(--surface) p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--sea-ink-soft)">
          Applied by Cloudinary
        </p>
        <ul className="space-y-2.5">
          {CLOUDINARY_TRANSFORMS.map(({ label, tag, desc }) => (
            <li key={label} className="flex items-start gap-3">
              <span className="mt-0.5 text-sm text-emerald-500">✓</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-(--sea-ink)">{label}</span>
                  <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] text-(--lagoon-deep) dark:bg-white/10">
                    {tag}
                  </code>
                </div>
                <p className="mt-0.5 text-xs text-(--sea-ink-soft)">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Moderation CTA — photo is pending review */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <p className="mb-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
          🕐 Awaiting moderation
        </p>
        <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
          Your photo was submitted and is queued for review. WebPurify will analyse it automatically — you can also approve or reject it manually.
        </p>
        <Button asChild className="w-full">
          <Link to="/moderate">Go to moderation queue →</Link>
        </Button>
      </div>

      <Button variant="outline" onClick={onReset} className="w-full">
        Upload another photo
      </Button>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
          : "border-(--line) bg-(--surface)"
      }`}
    >
      <p
        className={`text-lg font-bold ${
          highlight ? "text-emerald-600 dark:text-emerald-400" : "text-(--sea-ink)"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-(--sea-ink-soft)">{sub}</p>}
      <p className="text-[10px] font-medium uppercase tracking-wide text-(--sea-ink-soft)">
        {label}
      </p>
    </div>
  );
}
