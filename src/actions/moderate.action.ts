import { createServerFn } from "@tanstack/react-start";
import { updatePhotoStatus } from "../lib/mock-photos";
import type { Photo } from "../types/photo";

interface ModeratePayload {
  id: string;
  status: "approved" | "rejected" | "pending";
}

function validateModeratePayload(data: unknown): ModeratePayload {
  const d = data as Record<string, unknown>;
  if (
    typeof data !== "object" ||
    data === null ||
    typeof d["id"] !== "string" ||
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
    return updatePhotoStatus(data.id, data.status, "human");
  });
