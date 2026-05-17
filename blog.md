# Build a Community Photo Wall with TanStack Start, Cloudinary AI Moderation, and Automatic Image Transformations

User-generated content is one of the most exciting parts of building a community product. It is also one of the scariest. Users upload enormous files, wrong formats, portraits that crop terribly, and occasionally content that should never be on your platform at all.

This guide walks you through building a **community photo wall** that handles all of that automatically. Every photo that arrives gets resized, watermarked, and face-cropped by Cloudinary before it ever touches your storage. WebPurify scans it for inappropriate content in the background. A moderation queue lets you override anything the AI gets wrong. And because we use Cloudinary's context fields as our metadata store, the whole thing runs on Vercel with zero database required.

Here is what the finished app looks like: **[Live demo](https://tanstack-start-community-photo-wall.vercel.app/)** · **[Source code](https://github.com/musebe/tanstack-start-community-photo-wall)**

---

## What you will build

- An upload page where community members submit photos
- A Cloudinary pipeline that automatically resizes, face-crops, watermarks, and converts every upload to WebP — before it is stored
- WebPurify AI moderation that runs in the background on every upload
- A moderation queue where you can approve, reject, or override the AI decision
- A public gallery that shows only approved photos
- Badges on every photo showing whether it was approved by the AI or a human reviewer
- A beautiful lightbox with an ambient glow effect using Cloudinary image effects
- Persistent metadata stored entirely in Cloudinary — no separate database, works perfectly on Vercel

---

## Tech stack

| Tool | What it does in this project |
|---|---|
| [TanStack Start](https://tanstack.com/start) | Full-stack React framework — handles routing and server functions |
| [TanStack Router](https://tanstack.com/router) | File-based routing with type safety |
| [Cloudinary](https://cloudinary.com) | Image upload, transformation, moderation, and metadata storage |
| [WebPurify addon](https://cloudinary.com/documentation/webpurify_image_moderation_addon) | AI-powered image moderation integrated directly into Cloudinary |
| [Nitro](https://nitro.build) | Deployment adapter for Vercel |
| [Tailwind CSS v4](https://tailwindcss.com) | Styling |
| [ShadCN UI](https://ui.shadcn.com) | Accessible component primitives |

---

## Step 1: Set up your Cloudinary account

If you do not have a Cloudinary account, create a free one at [cloudinary.com](https://cloudinary.com). Once you are in, grab your credentials from the **Dashboard**:

- Cloud name
- API key
- API secret

You will need these in a moment.

### Enable the WebPurify addon

WebPurify is a Cloudinary addon that scans images for inappropriate content automatically. Go to **Add-ons** in your Cloudinary console and activate the free WebPurify plan. This is what powers the automatic AI moderation in this app.

---

## Step 2: Create an upload preset

An upload preset is a saved collection of settings that Cloudinary applies to every upload that references it. Instead of sending transformation instructions with every upload request, you configure them once in the preset and Cloudinary handles the rest.

Go to **Settings → Upload → Upload presets → Add upload preset**.

### General tab

| Field | Value |
|---|---|
| Preset name | `community_photo_wall` |
| Signing mode | **Signed** |
| Folder | `community-photo-wall` |

### Upload tab

Under **Tags**, add `ugc` and `photo-wall` separated by commas. The `photo-wall` tag is how the app finds all photos later — we query Cloudinary's API for all assets tagged `photo-wall` instead of using a database.

### Incoming transformations tab

This is the most important part. Incoming transformations run **before** the image is stored. The file that lands in your Cloudinary account is already the processed version. There are no per-request compute costs later.

Add a chained transformation with these two steps in order:

**Step 1 — Resize and optimise:**

| Parameter | Value |
|---|---|
| Crop mode | `fill` |
| Width | `800` |
| Height | `800` |
| Gravity | `auto:faces` |
| Quality | `auto` |
| Format | `webp` |

`g_auto:faces` tells Cloudinary to detect faces in the image and centre the crop on them. Portrait photos always look good because the person's face stays in frame.

**Step 2 — Watermark:**

| Parameter | Value |
|---|---|
| Overlay | Your logo `public_id` (or leave for text fallback) |
| Gravity | `south_east` |
| X / Y | `12` / `12` |
| Width | `130` |
| Opacity | `60` |
| Effect | `brightness:20` |

If you do not have a logo uploaded to Cloudinary yet, the app falls back to a `© PhotoWall` text watermark automatically.

### Moderation tab

Set **Moderation** to **WebPurify**. Every upload that uses this preset will be automatically scanned. The result (`approved` or `rejected`) is stored as Cloudinary metadata and can be fetched via the Admin API.

Click **Save**.

---

## Step 3: Configure environment variables

Create a `.env.local` file in your project root:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=community_photo_wall

# Optional: public_id of a logo image in your Cloudinary account
CLOUDINARY_WATERMARK_PUBLIC_ID=

# Exposed to the browser for delivery URL building (no secret needed)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

Notice that `VITE_CLOUDINARY_CLOUD_NAME` is separate from `CLOUDINARY_CLOUD_NAME`. Cloudinary delivery URLs are completely public — you only need the cloud name, never the API secret. By prefixing with `VITE_`, TanStack Start/Vite exposes it to the browser bundle safely.

---

## Step 4: The Cloudinary library

All Cloudinary Node.js SDK calls live in one file: [`src/lib/cloudinary.ts`](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/lib/cloudinary.ts).

This is intentional. TanStack Start's bundler strips server-only code from the client bundle, but only if module imports are cleanly separated. If you import the Cloudinary SDK anywhere that the browser might load, you will get a runtime error. Keeping everything in one file makes the boundary obvious.

The file does four things:

**1. Configure the SDK**

```ts
cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
  secure: true,
});
```

**2. Upload a photo**

`uploadToCloudinary` takes a raw file buffer and streams it to Cloudinary using `upload_stream`. It passes the upload preset (which triggers all the incoming transformations automatically) and stores app metadata as Cloudinary context fields:

```ts
context: {
  pw_id: metadata.id,
  pw_title: safeCtxValue(metadata.title),
  pw_status: "pending",
  pw_original_size: String(metadata.originalSize),
  pw_moderation_source: "webpurify",
}
```

Context fields are key-value pairs stored directly on the Cloudinary asset. This is how the app persists photo metadata without a database — more on this in a moment.

→ [View the full upload function on GitHub](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/lib/cloudinary.ts)

**3. Fetch all photos**

`getAllPhotosFromCloudinary` uses the Cloudinary Admin API to fetch all assets tagged `photo-wall`:

```ts
const result = await cloudinary.api.resources_by_tag("photo-wall", {
  context: true,
  max_results: 100,
});
```

The `context: true` option includes all the `pw_*` fields in the response. Each resource is converted to a `Photo` object using the context values.

**4. Update a photo's status**

`updatePhotoStatusOnCloudinary` uses `uploader.add_context` to update individual context keys without touching the rest:

```ts
await cloudinary.uploader.add_context(
  `pw_status=${status}|pw_moderation_source=${source}`,
  [publicId]
);
```

This is the equivalent of a database `UPDATE` — but it's just a Cloudinary API call.

---

## Step 5: Cloudinary as your database

Most tutorials reach for a database immediately. This app skips it entirely by using Cloudinary's **context fields** as the metadata store.

Every photo asset in Cloudinary stores these fields:

| Context key | What it holds |
|---|---|
| `pw_id` | The app's unique ID for this photo |
| `pw_title` | The user-supplied caption |
| `pw_status` | `pending`, `approved`, or `rejected` |
| `pw_original_size` | Original file size in bytes before upload |
| `pw_moderation_source` | `webpurify` or `human` |

When the gallery loads, it calls `resources_by_tag("photo-wall")` and reads these fields off the response. When a moderator approves a photo, it calls `add_context` to update `pw_status`. No database migrations, no connection strings, no Vercel-incompatible file writes.

This works on Vercel's ephemeral serverless environment because the data lives in Cloudinary, not in the server's memory or filesystem.

---

## Step 6: Chunked upload

Uploading large files as a single base64-encoded string runs into two problems: memory spikes and browser timeouts. The solution is to split the file into chunks on the client, send them one at a time, and assemble them on the server.

The upload form splits the file into 1 MB chunks:

```ts
const totalChunks = Math.max(1, Math.ceil(bytes.length / CHUNK_SIZE));

for (let i = 0; i < totalChunks; i++) {
  const chunk = bytes.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
  const chunkBase64 = arrayBufferToBase64(chunk.buffer);

  const result = await uploadChunkAction({ data: { uploadId, chunkIndex: i, totalChunks, chunkBase64, ... } });
}
```

The server function [`src/actions/upload-chunk.action.ts`](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/actions/upload-chunk.action.ts) stores each chunk in a `Map` keyed by `uploadId`. When the final chunk arrives, it concatenates all the buffers and calls `uploadToCloudinary`.

```ts
const chunks = chunkBuffers.get(uploadId)!;
chunks[chunkIndex] = Buffer.from(chunkBase64, "base64");

if (received < totalChunks) return null; // still waiting

const fileBuffer = Buffer.concat(chunks as Buffer[]);
return uploadToCloudinary(fileBuffer, filename, metadata);
```

The client drives a progress bar as chunks complete — real progress, not a fake animation.

→ [View the upload chunk action on GitHub](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/actions/upload-chunk.action.ts)

### Client-side validation (best practice)

Before a single byte leaves the browser, the app validates the file:

```ts
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Only JPEG, PNG, WebP or GIF images are allowed.";
  if (file.size > MAX_FILE_SIZE) return `File must be under ${MAX_FILE_SIZE / 1024 / 1024} MB.`;
  return null;
}
```

This prevents bandwidth waste and gives instant feedback. It is never a substitute for server-side validation, but it is the right first line of defence.

→ [View validation utils on GitHub](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/lib/utils.ts)

---

## Step 7: The transformation pipeline

When the assembled buffer hits `uploadToCloudinary`, the upload preset takes over. Here is the full transformation chain that Cloudinary applies before storing the image:

```
User file → Resize (c_fill, 800×800) → Face crop (g_auto:faces) → Watermark → f_webp, q_auto → Stored
```

The app also applies transformations at **delivery time** using Cloudinary URLs built in [`src/lib/cloudinary-url.ts`](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/lib/cloudinary-url.ts).

For the gallery grid, each card requests a fresh crop:

```ts
export function getGalleryUrl(publicId: string, fallback: string): string {
  return `${BASE}/f_auto,q_auto,c_fill,g_auto:faces,w_800,h_800/${publicId}`;
}
```

For the lightbox ambient background, the app requests a tiny 80px copy with heavy Cloudinary-side blur and a saturation boost:

```ts
export function getAmbientUrl(publicId: string, fallback: string): string {
  return `${BASE}/f_jpg,q_1,w_80,e_blur:1500,e_saturation:50/${publicId}`;
}
```

This ~1 KB image is stretched behind the sharp photo in the lightbox. Combined with a CSS radial vignette, it creates the ambient "colour glow" effect that matches the photo's own palette — the same technique Apple Music uses for album art. Because Cloudinary does the blur server-side, the browser never has to process a large image to achieve the effect.

→ [View all delivery URL helpers on GitHub](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/lib/cloudinary-url.ts)

---

## Step 8: WebPurify AI moderation

Because you set **WebPurify** as the moderation provider in your upload preset, every upload is automatically scanned. Cloudinary sends the result back either via webhook (when you have a public URL configured) or via the Admin API.

The app supports both modes:

**Polling (development / demo):** The moderation page has a "Check status" button. Clicking it calls `refreshModerationAction`, which polls the Cloudinary Admin API:

```ts
const resource = await cloudinary.api.resource(publicId, { moderation: true });
const entry = resource.moderation.find((m) => m.kind === "webpurify");
const status = entry.status; // "approved" | "rejected" | "pending"
```

If WebPurify has reached a decision, the result is written back to Cloudinary context (`pw_status`, `pw_moderation_source`) and the page refreshes automatically.

→ [View the refresh moderation action on GitHub](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/actions/refresh-moderation.action.ts)

**Webhook (production):** Set `CLOUDINARY_WEBHOOK_URL` to your deployed URL. Cloudinary will POST the moderation result to that endpoint as soon as WebPurify finishes.

---

## Step 9: The moderation queue

The moderation page ([`src/routes/moderate.tsx`](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/routes/moderate.tsx)) loads all photos from Cloudinary and groups them by status.

Each photo row shows:
- A thumbnail
- The title, upload date, and file size stats
- A badge showing who moderated it — **🤖 WebPurify** or **👤 Human**
- Approve, Reject, and Reset buttons

When a moderator clicks Approve or Reject, `moderatePhotoAction` is called:

```ts
return updatePhotoStatusOnCloudinary(data.publicId, data.status, "human");
```

The `"human"` source overwrites whatever WebPurify set. This means the moderation queue is always the source of truth — you can correct the AI whenever it makes a mistake.

→ [View the moderate action on GitHub](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/actions/moderate.action.ts)

---

## Step 10: The gallery

The gallery page ([`src/routes/gallery.tsx`](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/routes/gallery.tsx)) only shows approved photos:

```ts
export const Route = createFileRoute("/gallery")({
  loader: () => getApprovedPhotosAction(),
  component: GalleryPage,
});
```

`getApprovedPhotosAction` fetches all photos from Cloudinary and filters by `status === "approved"`. Because the data comes from Cloudinary's API on every page load, the gallery is always consistent with the current moderation state — no cache invalidation required.

Each photo card ([`src/components/photo-card.tsx`](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/components/photo-card.tsx)) shows:
- The processed image from Cloudinary
- A coloured status pill (green for approved, amber for pending, red for rejected)
- A moderation source badge (🤖 WebPurify or 👤 Human)
- Cloudinary transformation chips that slide in on hover, showing exactly what was applied

---

## Step 11: The lightbox

Clicking any photo opens a lightbox ([`src/components/photo-lightbox.tsx`](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/src/components/photo-lightbox.tsx)) with two sections in the left panel:

**The image section** — a rounded container with the ambient glow background (the Cloudinary `e_blur:1500,e_saturation:50` trick), a radial vignette overlay, and the sharp photo floating on top.

**The tags row** — status, moderation source, and Cloudinary badge displayed cleanly below the image with proper breathing room.

The right panel shows transformation stats (dimensions, file size, savings percentage), the full list of Cloudinary transforms applied, and a link to the moderation queue.

---

## Step 12: Deploy to Vercel with Nitro

TanStack Start deploys to Vercel via [Nitro](https://nitro.build), which handles the serverless adapter automatically. First, install it:

```bash
npm install nitro
```

Then add it to your Vite config ([`vite.config.ts`](https://github.com/musebe/tanstack-start-community-photo-wall/blob/main/vite.config.ts)):

```ts
import { nitro } from 'nitro/vite'

export default defineConfig({
  plugins: [tanstackStart(), nitro(), viteReact()],
})
```

That is it. Nitro detects that the build target is Vercel and generates the correct serverless function output in `.output/`. No `vercel.json`, no custom API routes, no adapter configuration needed.

Push to GitHub, import to Vercel, add your environment variables in the Vercel project settings, and deploy.

---

## The full flow, end to end

```
User picks a file
  → Client validates type and size immediately
  → File split into 1 MB chunks
  → Chunks sent one at a time to the TanStack Start server function
  → Server assembles chunks into a Buffer
  → Buffer uploaded to Cloudinary with the upload preset
  → Cloudinary applies: resize → face crop → watermark → WebP conversion
  → Cloudinary stores the processed image with pw_* context fields
  → WebPurify scans the image in the background (async)
  → Photo appears in moderation queue with status "pending"
  → Moderator clicks "Check status" or webhook fires
  → WebPurify result written back to pw_status via add_context
  → Moderator can override with Approve/Reject
  → Approved photo appears in the public gallery
```

---

## What makes this approach powerful

**Incoming transformations are a one-time cost.** The resize, face crop, watermark, and format conversion happen exactly once — at upload. Every delivery after that is just serving a cached, already-processed file. You never pay for per-request transformations.

**Cloudinary as a database removes infrastructure complexity.** `resources_by_tag` is your SELECT. `add_context` is your UPDATE. No database provisioning, no connection pooling, no migration files. This is not the right choice for every project, but for a demo or small community app it is perfectly reliable.

**WebPurify runs without blocking the upload.** The photo is stored and available to moderators immediately. The AI result arrives asynchronously. You always have the manual override as a safety net.

**The ambient glow in the lightbox is a 1 KB Cloudinary delivery URL.** Instead of running a large image through CSS `blur()` in the browser (GPU-intensive, causes layout reflows), you request a tiny pre-blurred, pre-saturated version from Cloudinary. The browser just stretches one small image.

---

## Where to go next

- Add a webhook endpoint to receive WebPurify results automatically instead of polling
- Use Cloudinary's `resources_by_tag` cursor for pagination when the photo count grows
- Add a `pw_uploader_email` context field to track who submitted each photo
- Explore Cloudinary's AI tagging (`auto_tagging`) to add searchable labels to every photo automatically

The full source code is at **[github.com/musebe/tanstack-start-community-photo-wall](https://github.com/musebe/tanstack-start-community-photo-wall)** and the live demo runs at **[tanstack-start-community-photo-wall.vercel.app](https://tanstack-start-community-photo-wall.vercel.app)**.
