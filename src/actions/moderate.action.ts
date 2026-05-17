import { createServerFn } from "@tanstack/react-start";
import { updatePhotoStatusOnCloudinary } from "../lib/cloudinary";
import type { Photo, PhotoStatus } from "../types/photo";

interface ModeratePayload {
  publicId: string;
  status: PhotoStatus;
}

function validateModeratePayload(data: unknown): ModeratePayload {
  const d = data as Record<string, unknown>;
  if (
    typeof data !== "object" ||
    data === null ||
    typeof d["publicId"] !== "string" ||
    !["approved", "rejected", "pending"].includes(d["status"] as string)
  ) {
    throw new Error("Invalid moderation payload");
  }
  return data as ModeratePayload;
}

export const moderatePhotoAction = createServerFn({ method: "POST" })
  .inputValidator(validateModeratePayload)
  .handler(async ({ data }): Promise<Photo | null> => {
    // Always tag as "human" — this is a manual override regardless of prior source
    return updatePhotoStatusOnCloudinary(data.publicId, data.status, "human");
  });
