import { v2 as cloudinary } from "cloudinary";
import type { CloudinaryUploadResult } from "../types/photo";

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
  secure: true,
});

/* ─────────────────────────────────────────────────────────────────── */
/* Transformation helpers                                               */
/* ─────────────────────────────────────────────────────────────────── */

/**
 * Incoming transformation applied at upload time — before the file is stored.
 *
 * Why incoming transformations?
 *  • They run once (on upload), not on every delivery request.
 *  • The stored file is already the final, optimised version — zero per-request cost.
 *  • Ideal for UGC: you control the output regardless of what the user sent.
 *
 * Step 1 — Resize + face-detect crop
 *   c_fill       : fill the target rectangle (no letterboxing)
 *   g_auto:faces : centre the crop on detected faces — portraits always look right
 *   w_800, h_800 : max 800 × 800 px
 *   q_auto       : Cloudinary selects the best quality/size tradeoff
 *   f_webp       : store as WebP regardless of the original format
 */
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

/**
 * Step 2 — Watermark overlay.
 *
 * When CLOUDINARY_WATERMARK_PUBLIC_ID is set: overlay an uploaded logo image.
 * Fallback: render "© PhotoWall" as a text overlay using a built-in font.
 *
 * gravity: south_east  → bottom-right corner
 * opacity: 60          → semi-transparent so it does not dominate the photo
 */
function buildWatermarkStep(watermarkPublicId: string | undefined): object {
  if (watermarkPublicId) {
    return {
      overlay: watermarkPublicId,
      gravity: "south_east",
      x: 12,
      y: 12,
      width: 130,
      opacity: 60,
      effect: "brightness:20",
    };
  }

  return {
    overlay: {
      font_family: "Arial",
      font_size: 20,
      font_weight: "bold",
      text: "© PhotoWall",
    },
    gravity: "south_east",
    x: 12,
    y: 12,
    color: "white",
    opacity: 60,
  };
}

/* ─────────────────────────────────────────────────────────────────── */
/* Main upload function                                                  */
/* ─────────────────────────────────────────────────────────────────── */

/**
 * Upload a raw file buffer to Cloudinary with incoming transformations.
 *
 * The transformation pipeline (applied in order before storage):
 *  1. Resize to 800 × 800, fill crop, face-detect gravity, auto quality, WebP
 *  2. Logo (or text) watermark — bottom-right, semi-transparent
 *
 * Returns the Cloudinary result including the final `secure_url`, `public_id`,
 * processed dimensions, and `bytes` (the stored file size after transformation).
 */
/**
 * Poll the Cloudinary Admin API for the WebPurify moderation result of one asset.
 * Returns "approved", "rejected", or "pending" (still processing).
 */
export async function getModerationStatus(
  publicId: string
): Promise<"approved" | "rejected" | "pending"> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resource = await (cloudinary.api.resource as any)(publicId, {
    moderation: true,
  });

  console.log("[Cloudinary] moderation resource:", resource?.moderation);

  const entry = Array.isArray(resource?.moderation)
    ? resource.moderation.find((m: { kind: string }) => m.kind === "webpurify")
    : null;

  if (!entry) return "pending";

  const s = entry.status as string;
  if (s === "approved" || s === "rejected") return s;
  return "pending";
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  filename: string
): Promise<CloudinaryUploadResult> {
  const watermarkPublicId = process.env["CLOUDINARY_WATERMARK_PUBLIC_ID"];
  const uploadPreset = process.env["CLOUDINARY_UPLOAD_PRESET"];

  const transformation: object[] = [
    buildResizeStep(),
    buildWatermarkStep(watermarkPublicId),
  ];

  const notificationUrl = process.env["CLOUDINARY_WEBHOOK_URL"];

  const uploadOptions = {
    folder: "community-photo-wall",
    public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, "")}`,
    transformation,
    resource_type: "image" as const,
    tags: ["ugc", "photo-wall"],
    moderation: "webpurify",
    ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    ...(uploadPreset ? { upload_preset: uploadPreset } : {}),
  };

  console.log("[Cloudinary] upload starting", {
    filename,
    bytes: fileBuffer.length,
    cloudName: process.env["CLOUDINARY_CLOUD_NAME"],
    preset: uploadPreset ?? "(none — fine, will use API key auth)",
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
