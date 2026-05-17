import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes without conflicts — required by ShadCN components */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an ISO date string into a human-readable date */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Allowed MIME types for community photo uploads */
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Maximum allowed file size in bytes (5 MB) */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Format bytes into a human-readable string (KB / MB) */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Convert an ArrayBuffer to a base64 string without hitting the call-stack limit.
 *
 * The naive `btoa(String.fromCharCode(...new Uint8Array(buf)))` pattern spreads
 * potentially millions of arguments onto String.fromCharCode and blows the stack
 * for files larger than ~1 MB. This version processes 32 KB at a time instead.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000; // 32 KB — safe call-stack size
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
  }
  return btoa(parts.join(""));
}

/**
 * Validate a File before upload.
 * Returns an error message string, or null if the file is valid.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type}. Please upload a JPEG, PNG, WebP, or GIF.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max size is 5 MB.`;
  }
  return null;
}
