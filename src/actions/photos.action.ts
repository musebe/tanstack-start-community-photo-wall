import { createServerFn } from "@tanstack/react-start";
import { getAllPhotosFromCloudinary } from "../lib/cloudinary";
import type { Photo } from "../types/photo";

/** All photos (any status) — used by the moderation page */
export const getAllPhotosAction = createServerFn({ method: "GET" }).handler(
  (): Promise<Photo[]> => getAllPhotosFromCloudinary()
);

/** Only approved photos — used by the public gallery */
export const getApprovedPhotosAction = createServerFn({ method: "GET" }).handler(
  async (): Promise<Photo[]> => {
    const all = await getAllPhotosFromCloudinary();
    return all.filter((p) => p.status === "approved");
  }
);
