import { createServerFn } from "@tanstack/react-start";
import { getModerationStatus } from "../lib/cloudinary";
import { updatePhotoByPublicId } from "../lib/mock-photos";
import type { Photo } from "../types/photo";

interface RefreshPayload {
  publicId: string;
}

function validateRefreshPayload(data: unknown): RefreshPayload {
  const d = data as Record<string, unknown>;
  if (
    typeof data !== "object" ||
    data === null ||
    typeof d["publicId"] !== "string"
  ) {
    throw new Error("Invalid refresh payload");
  }
  return data as RefreshPayload;
}

/**
 * Poll the Cloudinary Admin API for the current WebPurify moderation status
 * of a single asset. Updates the mock store and returns the updated photo.
 *
 * Production alternative: set CLOUDINARY_WEBHOOK_URL to your server's public
 * URL (/api/cloudinary-webhook) so Cloudinary pushes the result automatically.
 * In development, this polling button works without any tunnel.
 */
export const refreshModerationAction = createServerFn({ method: "POST" })
  .inputValidator(validateRefreshPayload)
  .handler(async ({ data }): Promise<Photo | null> => {
    const { publicId } = data;

    console.log("[Moderation] Polling Cloudinary for WebPurify status:", publicId);

    const status = await getModerationStatus(publicId);

    console.log(`[Moderation] WebPurify says: ${status}`);

    if (status === "pending") {
      return null; // Still processing
    }

    return updatePhotoByPublicId(publicId, status, "webpurify");
  });
