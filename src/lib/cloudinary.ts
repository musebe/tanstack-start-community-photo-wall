import { v2 as cloudinary } from "cloudinary";
import type { CloudinaryUploadResult, Photo, PhotoStatus } from "../types/photo";

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
  secure: true,
});

/* ─────────────────────────────────────────────────────────────────── */
/* Context helpers                                                       */
/* ─────────────────────────────────────────────────────────────────── */

// Strip characters that would break Cloudinary's key=value|key=value format
function safeCtxValue(s: string | number | undefined): string {
  return String(s ?? "").replace(/[|=\n\r]/g, " ").trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resourceToPhoto(r: any): Photo {
  const ctx: Record<string, string> = r?.context?.custom ?? {};
  return {
    id:               ctx["pw_id"]               ?? String(r.public_id),
    title:            ctx["pw_title"]             ?? String(r.public_id).split("/").pop() ?? "",
    url:              String(r.secure_url),
    publicId:         String(r.public_id),
    status:           (ctx["pw_status"] as PhotoStatus) ?? "pending",
    createdAt:        String(r.created_at),
    width:            Number(r.width),
    height:           Number(r.height),
    processedSize:    Number(r.bytes),
    originalSize:     ctx["pw_original_size"] ? Number(ctx["pw_original_size"]) : undefined,
    moderationSource: ctx["pw_moderation_source"] as Photo["moderationSource"] | undefined,
  };
}

/* ─────────────────────────────────────────────────────────────────── */
/* Photo store — Cloudinary as the database                             */
/* ─────────────────────────────────────────────────────────────────── */

/**
 * Fetch all PhotoWall photos from Cloudinary using the "photo-wall" tag.
 * Context fields (pw_*) carry all app metadata — no separate database needed.
 */
export async function getAllPhotosFromCloudinary(): Promise<Photo[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (cloudinary.api.resources_by_tag as any)("photo-wall", {
      context: true,
      max_results: 100,
    });
    const photos: Photo[] = (result.resources ?? []).map(resourceToPhoto);
    // Newest first
    return photos.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error("[Cloudinary] getAllPhotos failed:", err);
    return [];
  }
}

/**
 * Update pw_status (and optionally pw_moderation_source) on an existing asset.
 * Uses add_context which merges keys without overwriting unrelated metadata.
 */
export async function updatePhotoStatusOnCloudinary(
  publicId: string,
  status: PhotoStatus,
  moderationSource?: Photo["moderationSource"]
): Promise<Photo | null> {
  try {
    let contextStr = `pw_status=${safeCtxValue(status)}`;
    if (moderationSource) contextStr += `|pw_moderation_source=${safeCtxValue(moderationSource)}`;

    // add_context updates individual keys without replacing the full context
    await cloudinary.uploader.add_context(contextStr, [publicId]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resource = await (cloudinary.api.resource as any)(publicId, { context: true });
    console.log("[Cloudinary] updatePhotoStatus:", publicId, "→", status);
    return resourceToPhoto(resource);
  } catch (err) {
    console.error("[Cloudinary] updatePhotoStatus failed:", err);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────────── */
/* Moderation status poll (WebPurify)                                    */
/* ─────────────────────────────────────────────────────────────────── */

export async function getModerationStatus(
  publicId: string
): Promise<"approved" | "rejected" | "pending"> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resource = await (cloudinary.api.resource as any)(publicId, { moderation: true });
  const entry = Array.isArray(resource?.moderation)
    ? resource.moderation.find((m: { kind: string }) => m.kind === "webpurify")
    : null;
  if (!entry) return "pending";
  const s = entry.status as string;
  if (s === "approved" || s === "rejected") return s;
  return "pending";
}

/* ─────────────────────────────────────────────────────────────────── */
/* Transformation helpers                                               */
/* ─────────────────────────────────────────────────────────────────── */

function buildResizeStep(): object {
  return {
    width: 800,
    height: 800,
    crop: "fill",
    gravity: "auto:faces",
    quality: "auto",
    fetch_format: "webp",
  };
}

function buildWatermarkStep(watermarkPublicId: string | undefined): object {
  if (watermarkPublicId) {
    return {
      overlay: watermarkPublicId,
      gravity: "south_east",
      x: 12, y: 12, width: 130, opacity: 60, effect: "brightness:20",
    };
  }
  return {
    overlay: { font_family: "Arial", font_size: 20, font_weight: "bold", text: "© PhotoWall" },
    gravity: "south_east",
    x: 12, y: 12, color: "white", opacity: 60,
  };
}

/* ─────────────────────────────────────────────────────────────────── */
/* Upload                                                                */
/* ─────────────────────────────────────────────────────────────────── */

/**
 * Upload a raw file buffer to Cloudinary.
 * Stores app metadata (id, title, status, originalSize, moderationSource)
 * as Cloudinary context fields so photos survive server restarts.
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  filename: string,
  metadata: { id: string; title: string; originalSize: number }
): Promise<CloudinaryUploadResult> {
  const watermarkPublicId = process.env["CLOUDINARY_WATERMARK_PUBLIC_ID"];
  const uploadPreset = process.env["CLOUDINARY_UPLOAD_PRESET"];
  const notificationUrl = process.env["CLOUDINARY_WEBHOOK_URL"];

  const transformation: object[] = [buildResizeStep(), buildWatermarkStep(watermarkPublicId)];

  const uploadOptions = {
    folder: "community-photo-wall",
    public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, "")}`,
    transformation,
    resource_type: "image" as const,
    tags: ["ugc", "photo-wall"],
    moderation: "webpurify",
    // All app metadata stored here — no separate database needed
    context: {
      pw_id:                metadata.id,
      pw_title:             safeCtxValue(metadata.title),
      pw_status:            "pending",
      pw_original_size:     String(metadata.originalSize),
      pw_moderation_source: "webpurify",
    },
    ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    ...(uploadPreset ? { upload_preset: uploadPreset } : {}),
  };

  console.log("[Cloudinary] upload starting", {
    filename,
    bytes: fileBuffer.length,
    cloudName: process.env["CLOUDINARY_CLOUD_NAME"],
    preset: uploadPreset ?? "(none)",
    metaId: metadata.id,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) {
        console.error("[Cloudinary] upload error:", error);
        reject(
          new Error(
            error
              ? `Cloudinary ${error.http_code ?? "error"}: ${error.message}`
              : "Cloudinary returned no result"
          )
        );
        return;
      }
      console.log("[Cloudinary] upload success:", {
        public_id: result.public_id,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      });
      resolve({
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      });
    });
    stream.end(fileBuffer);
  });
}
