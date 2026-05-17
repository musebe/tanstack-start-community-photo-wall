/**
 * Client-safe Cloudinary URL builder.
 *
 * Cloudinary delivery URLs are public — no API secret is needed to build them.
 * We only need the cloud name, which is safe to expose to the browser via the
 * VITE_ prefix.
 *
 * All functions return the stored URL as a fallback for demo / non-Cloudinary photos.
 */

const CLOUD_NAME = import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] as
  | string
  | undefined;

const BASE = (cloudName: string) =>
  `https://res.cloudinary.com/${cloudName}/image/upload`;

/** Returns true when we can build Cloudinary transformation URLs for this photo */
export function isCloudinaryPhoto(publicId: string): boolean {
  return Boolean(CLOUD_NAME) && !publicId.startsWith("demo/");
}

/**
 * Ambient background URL — 80px wide, Cloudinary-blurred + saturation-boosted.
 * Designed to be stretched full-bleed behind the sharp image in the lightbox,
 * creating an "ambient light" glow that matches the photo's colour palette.
 * The file is ~1 KB so it loads near-instantly.
 */
export function getAmbientUrl(publicId: string, fallback: string): string {
  if (!CLOUD_NAME || publicId.startsWith("demo/")) return fallback;
  return `${BASE(CLOUD_NAME)}/f_jpg,q_1,w_80,e_blur:1500,e_saturation:50/${publicId}`;
}

/**
 * Gallery delivery URL — 800 × 800, auto-format, auto-quality, face-detect fill.
 *
 * Transformation breakdown:
 *  f_auto   → serve WebP/AVIF based on browser support
 *  q_auto   → Cloudinary picks the best quality level for the file size
 *  c_fill   → crop mode: fill the target dimensions without whitespace
 *  g_auto:faces → centre the crop on detected faces
 *  w_800,h_800  → target dimensions
 */
export function getGalleryUrl(publicId: string, fallback: string): string {
  if (!CLOUD_NAME || publicId.startsWith("demo/")) return fallback;
  return `${BASE(CLOUD_NAME)}/f_auto,q_auto,c_fill,g_auto:faces,w_800,h_800/${publicId}`;
}

/**
 * Thumbnail URL — square 400 × 400, face-prioritised thumb crop.
 *
 * c_thumb,g_face zooms in tightly on the primary detected face.
 */
export function getThumbnailUrl(publicId: string, fallback: string): string {
  if (!CLOUD_NAME || publicId.startsWith("demo/")) return fallback;
  return `${BASE(CLOUD_NAME)}/f_auto,q_auto,c_thumb,g_face,w_400,h_400/${publicId}`;
}

/**
 * Returns the human-readable breakdown of transformations applied to every upload.
 * Shown in the UI to make Cloudinary's pipeline visible to the reader.
 */
export const CLOUDINARY_TRANSFORMS = [
  {
    label: "Incoming transform",
    tag: "c_fill, w_800, h_800",
    desc: "Resized to 800×800 before storage — reduces bandwidth and disk usage.",
  },
  {
    label: "Face-detect crop",
    tag: "g_auto:faces",
    desc: "Gravity set to auto:faces so the crop always centres on detected faces.",
  },
  {
    label: "Watermark overlay",
    tag: "l_logo / text overlay",
    desc: "Brand stamp applied at upload time — baked into the stored file.",
  },
  {
    label: "Auto format",
    tag: "f_auto",
    desc: "WebP or AVIF served automatically based on browser support.",
  },
  {
    label: "Auto quality",
    tag: "q_auto",
    desc: "Cloudinary picks the smallest file size with acceptable fidelity.",
  },
] as const;
