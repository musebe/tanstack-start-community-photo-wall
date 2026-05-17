import { createServerFn } from "@tanstack/react-start";
import { uploadToCloudinary } from "../lib/cloudinary";
import { addPhoto } from "../lib/mock-photos";
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
 * Receives one chunk at a time. Returns the created Photo on the final chunk;
 * null for intermediate chunks.
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

    if (received < totalChunks) {
      return null;
    }

    // All chunks arrived — assemble and upload
    console.log(`[Chunk] all chunks received for "${uploadId}", assembling ${totalChunks} chunks…`);
    chunkBuffers.delete(uploadId);
    const fileBuffer = Buffer.concat(chunks as Buffer[]);
    console.log(`[Chunk] assembled buffer: ${fileBuffer.length} bytes`);

    const result = await uploadToCloudinary(fileBuffer, filename);

    return addPhoto({
      title: title.trim() || filename,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      processedSize: result.bytes,
      originalSize,
      // WebPurify moderation was requested — status will be updated via webhook
      moderationSource: "webpurify",
    });
  });
