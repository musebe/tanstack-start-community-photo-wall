import type { Photo } from "../types/photo";

/**
 * In-memory photo store — acts as a stand-in for a real database.
 * Replace this module with a Prisma (or similar) adapter when you are
 * ready to persist data.
 *
 * The store is module-level state, so it survives between requests in
 * the same Node.js process (dev mode). In production, use a real DB.
 */
const store: Photo[] = [
  {
    id: "demo-1",
    title: "Mountain Sunrise",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    publicId: "demo/mountain-sunrise",
    status: "approved",
    createdAt: "2024-11-01T08:00:00Z",
    width: 800,
    height: 800,
    processedSize: 312_000,
    originalSize: 3_800_000,
  },
  {
    id: "demo-2",
    title: "City at Night",
    url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800",
    publicId: "demo/city-night",
    status: "approved",
    createdAt: "2024-11-03T20:30:00Z",
    width: 800,
    height: 800,
    processedSize: 278_000,
    originalSize: 4_200_000,
  },
  {
    id: "demo-3",
    title: "Forest Path",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800",
    publicId: "demo/forest-path",
    status: "approved",
    createdAt: "2024-11-05T14:15:00Z",
    width: 800,
    height: 800,
    processedSize: 195_000,
    originalSize: 2_900_000,
  },
  {
    id: "demo-4",
    title: "Ocean Waves",
    url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800",
    publicId: "demo/ocean-waves",
    status: "pending",
    createdAt: "2024-11-10T09:45:00Z",
    width: 800,
    height: 800,
    processedSize: 241_000,
    originalSize: 3_100_000,
  },
];

/** Retrieve every photo regardless of status */
export function getAllPhotos(): Photo[] {
  return [...store];
}

/** Retrieve only photos that have been approved */
export function getApprovedPhotos(): Photo[] {
  return store.filter((p) => p.status === "approved");
}

/** Add a new photo to the store with "pending" status */
export function addPhoto(
  data: Omit<Photo, "id" | "status" | "createdAt">
): Photo {
  const photo: Photo = {
    ...data,
    id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  store.push(photo);
  return photo;
}

/** Update the moderation status of a photo by id */
export function updatePhotoStatus(
  id: string,
  status: Photo["status"],
  moderationSource?: Photo["moderationSource"]
): Photo | null {
  const photo = store.find((p) => p.id === id);
  if (!photo) return null;
  photo.status = status;
  if (moderationSource) photo.moderationSource = moderationSource;
  return photo;
}

/** Update status by Cloudinary public_id — used by the webhook handler */
export function updatePhotoByPublicId(
  publicId: string,
  status: Photo["status"],
  moderationSource?: Photo["moderationSource"]
): Photo | null {
  const photo = store.find((p) => p.publicId === publicId);
  if (!photo) return null;
  photo.status = status;
  if (moderationSource) photo.moderationSource = moderationSource;
  return photo;
}
