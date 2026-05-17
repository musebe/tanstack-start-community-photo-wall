import { createServerFn } from "@tanstack/react-start";
import { uploadToCloudinary } from "../lib/cloudinary";
import { addPhoto } from "../lib/mock-photos";
import type { Photo } from "../types/photo";

/** Shape of the data sent from the browser to the server */
interface UploadPayload {
  base64: string;
  filename: string;
  title: string;
  /** Original file size in bytes — captured client-side before encoding */
  originalSize: number;
}

function validatePayload(data: unknown): UploadPayload {
  const d = data as Record<string, unknown>;
  if (
    typeof data !== "object" ||
    data === null ||
    typeof d["base64"] !== "string" ||
    typeof d["filename"] !== "string" ||
    typeof d["title"] !== "string" ||
    typeof d["originalSize"] !== "number"
  ) {
    throw new Error("Invalid upload payload");
  }
  return data as UploadPayload;
}

/**
 * Server function that receives an uploaded image as a base64-encoded string,
 * sends it to Cloudinary for resizing and watermarking, then stores the result
 * in the mock photo store with "pending" status.
 *
 * The photo will not appear in the public gallery until it is approved.
 */
export const uploadPhotoAction = createServerFn({ method: "POST" })
  .inputValidator(validatePayload)
  .handler(async ({ data }): Promise<Photo> => {
    const { base64, filename, title, originalSize } = data;

    // Decode base64 → Buffer for the Cloudinary SDK
    const fileBuffer = Buffer.from(base64, "base64");

    // Upload to Cloudinary — incoming transformations fire here
    const result = await uploadToCloudinary(fileBuffer, filename);

    // Persist to the mock store with "pending" status
    const photo = addPhoto({
      title: title.trim() || filename,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      processedSize: result.bytes, // bytes after Cloudinary processing
      originalSize,                // bytes before upload — for savings display
    });

    return photo;
  });
