import { createServerFn } from "@tanstack/react-start";
import { uploadToCloudinary } from "../lib/cloudinary";
import type { Photo } from "../types/photo";

interface ChunkPayload {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkBase64: string;
  filename: string;
  title: string;
  originalSize: number;
}

// Module-level map survives for the lifetime of the server process.
const chunkBuffers = new Map<string, (Buffer | null)[]>();

function validateChunkPayload(data: unknown): ChunkPayload {
  const d = data as Record<string, unknown>;
  if (
    typeof data !== "object" ||
    data === null ||
    typeof d["uploadId"] !== "string" ||
    typeof d["chunkIndex"] !== "number" ||
    typeof d["totalChunks"] !== "number" ||
    typeof d["chunkBase64"] !== "string" ||
    typeof d["filename"] !== "string" ||
    typeof d["title"] !== "string" ||
    typeof d["originalSize"] !== "number"
  ) {
    throw new Error("Invalid chunk payload");
  }
  return data as ChunkPayload;
}

/**
 * Receives one chunk at a time. On the final chunk, assembles the buffer,
 * uploads to Cloudinary (including all app metadata as context fields),
 * and returns the created Photo. Returns null for intermediate chunks.
 */
export const uploadChunkAction = createServerFn({ method: "POST" })
  .inputValidator(validateChunkPayload)
  .handler(async ({ data }): Promise<Photo | null> => {
    const { uploadId, chunkIndex, totalChunks, chunkBase64, filename, title, originalSize } = data;

    console.log(`[Chunk] received chunk ${chunkIndex + 1}/${totalChunks} for upload "${uploadId}"`);

    if (!chunkBuffers.has(uploadId)) {
      chunkBuffers.set(uploadId, new Array(totalChunks).fill(null));
    }

    const chunks = chunkBuffers.get(uploadId)!;
    chunks[chunkIndex] = Buffer.from(chunkBase64, "base64");

    const received = chunks.filter((c) => c !== null).length;
    console.log(`[Chunk] upload "${uploadId}": ${received}/${totalChunks} chunks received`);

    if (received < totalChunks) return null;

    console.log(`[Chunk] all chunks received for "${uploadId}", assembling…`);
    chunkBuffers.delete(uploadId);
    const fileBuffer = Buffer.concat(chunks as Buffer[]);
    console.log(`[Chunk] assembled buffer: ${fileBuffer.length} bytes`);

    // Generate a stable ID that gets stored in Cloudinary context
    const photoId = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const photoTitle = title.trim() || filename;

    const result = await uploadToCloudinary(fileBuffer, filename, {
      id: photoId,
      title: photoTitle,
      originalSize,
    });

    // Build Photo from upload result + metadata we just stored in Cloudinary context
    const photo: Photo = {
      id: photoId,
      title: photoTitle,
      url: result.secure_url,
      publicId: result.public_id,
      status: "pending",
      createdAt: new Date().toISOString(),
      width: result.width,
      height: result.height,
      processedSize: result.bytes,
      originalSize,
      moderationSource: "webpurify",
    };

    return photo;
  });
