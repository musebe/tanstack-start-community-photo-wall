/** Moderation status for a community photo submission */
export type PhotoStatus = "pending" | "approved" | "rejected";

/** A single photo submission from the community */
export interface Photo {
  id: string;
  /** Human-readable title or caption */
  title: string;
  /** Cloudinary secure URL after incoming transformations */
  url: string;
  /** Cloudinary public_id — used to build additional delivery URLs */
  publicId: string;
  /** Moderation status — only "approved" photos appear in the gallery */
  status: PhotoStatus;
  /** ISO 8601 timestamp of when the photo was uploaded */
  createdAt: string;
  /** Processed dimensions returned by Cloudinary after incoming transformations */
  width: number;
  height: number;
  /** File size (bytes) of the processed image stored by Cloudinary */
  processedSize: number;
  /** Original file size (bytes) before upload — supplied by the browser */
  originalSize?: number;
  /**
   * Who last set the moderation status.
   * "webpurify" = Cloudinary WebPurify addon result via webhook
   * "human"     = manually set on the moderation page
   * undefined   = demo seed data, not yet moderated
   */
  moderationSource?: "webpurify" | "human";
}

/** Payload returned after a successful Cloudinary upload */
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  /** Processed file size in bytes — returned by Cloudinary upload response */
  bytes: number;
}
