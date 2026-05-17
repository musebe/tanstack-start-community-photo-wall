# Community Photo Wall

A community UGC app built with **TanStack Start**, **Cloudinary**, **ShadCN UI**, and **Tailwind CSS v4**.

Users upload photos, Cloudinary processes them (resize · face crop · watermark · WebP), WebPurify automatically moderates them, and only approved photos appear in the public gallery. Cloudinary's context fields serve as the persistent metadata store — no separate database required.

---

## Routes

| Route | Description |
|---|---|
| `/` | Landing page — explains the app and the Cloudinary pipeline |
| `/upload` | Upload form — validates, chunks, and sends photos to Cloudinary |
| `/gallery` | Public photo wall — only **approved** photos are shown |
| `/moderate` | Moderation queue — approve, reject, or poll WebPurify for auto-moderation results |

---

## Tech stack

- [TanStack Start](https://tanstack.com/start) — full-stack React framework with server functions
- [TanStack Router](https://tanstack.com/router) — type-safe file-based routing
- [Cloudinary Node.js SDK v2](https://cloudinary.com/documentation/node_integration) — upload, transform, and metadata storage
- [WebPurify addon](https://cloudinary.com/documentation/webpurify_image_moderation_addon) — automatic AI image moderation
- [ShadCN UI](https://ui.shadcn.com) — accessible component primitives
- [Tailwind CSS v4](https://tailwindcss.com) — utility-first styling

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Cloudinary upload preset

In your [Cloudinary Console](https://cloudinary.com/console):

#### General tab

1. Go to **Settings → Upload → Upload presets → Add upload preset**
2. Set **Preset name** to `community_photo_wall`
3. Set **Signing mode** to **Signed**
4. Set **Folder** to `community-photo-wall`

#### Upload tab

5. Under **Tags**, add `ugc` and `photo-wall` (comma-separated)
   - `photo-wall` is the tag the app uses to fetch all photos via the Admin API
   - `ugc` marks assets as user-generated content

#### Incoming transformations tab

6. Click **Edit transformation** and add a chained transformation with these steps in order:

   | Step | Parameter | Value |
   |---|---|---|
   | 1 | Crop mode | `fill` |
   | 1 | Width | `800` |
   | 1 | Height | `800` |
   | 1 | Gravity | `auto:faces` |
   | 1 | Quality | `auto` |
   | 1 | Format | `webp` |
   | 2 | Overlay | your logo `public_id`, or use a text overlay: `© PhotoWall` |
   | 2 | Gravity | `south_east` |
   | 2 | X / Y offset | `12` / `12` |
   | 2 | Width | `130` |
   | 2 | Opacity | `60` |
   | 2 | Effect | `brightness:20` |

   Step 1 resizes and crops; step 2 adds the watermark. Both run before the file is stored.

#### Moderation tab (WebPurify addon required)

7. Under **Moderation**, select **WebPurify**
   - This triggers automatic AI moderation on every upload
   - The result (`approved` / `rejected`) is pushed via webhook or polled via the Admin API
   - You must have the [WebPurify addon](https://cloudinary.com/documentation/webpurify_image_moderation_addon) enabled on your Cloudinary account (free tier available)

8. Click **Save**

### 3. Set environment variables

Copy `.env.local` and fill in your values from the Cloudinary Console:

```bash
# Cloudinary credentials (Dashboard → API Keys)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Upload preset name from step 2
CLOUDINARY_UPLOAD_PRESET=community_photo_wall

# Optional: public_id of a Cloudinary-hosted logo to use as watermark.
# Leave empty to use the default "© PhotoWall" text watermark.
CLOUDINARY_WATERMARK_PUBLIC_ID=

# Optional: public HTTPS URL for Cloudinary to POST WebPurify results to.
# In development, run `npx ngrok http 3000` and paste the tunnel URL:
#   CLOUDINARY_WEBHOOK_URL=https://abc123.ngrok-free.app/api/cloudinary-webhook
# Without this, use the "Check status" button on the moderation page to poll manually.
CLOUDINARY_WEBHOOK_URL=

# Exposed to the browser — set to the same value as CLOUDINARY_CLOUD_NAME.
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How Cloudinary is used

### Upload pipeline

Every photo is chunked into 1 MB pieces on the client, streamed to the server via `createServerFn`, assembled into a single `Buffer`, then uploaded to Cloudinary via `upload_stream`. The following **incoming transformations** fire before the file is stored — the result is baked in, so delivery is instant with no per-request compute cost:

| Step | Cloudinary param | Effect |
|---|---|---|
| Resize | `c_fill, w_800, h_800` | Crops to 800×800, no whitespace |
| Face crop | `g_auto:faces` | Centres the crop on detected faces |
| Watermark | `l_<public_id>` or text overlay | Brand stamp baked into the stored file |
| Format | `f_webp` | Converts to WebP at upload time |
| Quality | `q_auto` | Smallest file size with acceptable fidelity |

### Cloudinary as the metadata database

All app metadata is stored as **Cloudinary context fields** on each asset — no separate database is needed:

| Context key | Value |
|---|---|
| `pw_id` | App-generated photo ID |
| `pw_title` | User-supplied caption |
| `pw_status` | `pending` / `approved` / `rejected` |
| `pw_original_size` | Original file size in bytes (before upload) |
| `pw_moderation_source` | `webpurify` or `human` |

Photos are fetched via `cloudinary.api.resources_by_tag("photo-wall")` and status updates are written via `cloudinary.uploader.add_context()` (merges individual keys without replacing the full context). This means photo data persists across server restarts and Vercel deploys.

### Moderation

Every upload starts with `status: pending` and is invisible in the gallery.

**Automatic (WebPurify)** — the Cloudinary WebPurify addon analyses the image asynchronously. If a webhook URL is configured, Cloudinary POSTs the result to your server. In development, click **Check status** on the moderation page to poll the Cloudinary Admin API manually.

**Manual (human override)** — the `/moderate` page lets you approve or reject any photo regardless of the WebPurify result. The moderation source badge (`🤖 WebPurify` / `👤 Human`) shows which source last set the status.

```
pending  ──→  approved  (appears in gallery)
         └──→  rejected  (stored but hidden)
```

---

## Project structure

```
src/
  actions/
    photos.action.ts              # getAllPhotosAction, getApprovedPhotosAction
    upload-chunk.action.ts        # Chunked upload → assemble → Cloudinary
    moderate.action.ts            # Human moderation — updates Cloudinary context
    refresh-moderation.action.ts  # Poll Cloudinary Admin API for WebPurify result
  components/
    upload-form.tsx               # File picker, chunk loop, progress UI
    photo-card.tsx                # Gallery card with status + moderation badges
    photo-lightbox.tsx            # Full-screen lightbox with blurred background fill
    photo-wall.tsx                # Responsive masonry grid
    pipeline-panel.tsx            # Visual upload pipeline explainer
    ui/                           # ShadCN UI primitives (Button, Card, Badge)
  lib/
    cloudinary.ts                 # Cloudinary SDK — upload, fetch, update (server-only)
    cloudinary-url.ts             # Client-safe URL builder (no API secret)
    utils.ts                      # cn(), formatDate(), file validation, arrayBufferToBase64
  routes/
    __root.tsx                    # Root layout (header, footer)
    index.tsx                     # Home page (/)
    upload.tsx                    # Upload page (/upload)
    gallery.tsx                   # Gallery page (/gallery)
    moderate.tsx                  # Moderation queue (/moderate)
    about.tsx                     # About page (/about)
  types/
    photo.ts                      # Photo, PhotoStatus, CloudinaryUploadResult
```

> **Important:** `src/lib/cloudinary.ts` is the only file that imports from the `cloudinary` npm package. All other files import from `../lib/cloudinary`. This keeps the Cloudinary Node.js SDK out of the client bundle.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm test` | Run unit tests with Vitest |

---

## Deploying to Vercel

1. Push the repo to GitHub
2. Import into [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` in the Vercel project settings
4. Deploy — Vercel runs `npm run build` and serves the TanStack Start SSR output

No database or persistent storage is required; Cloudinary holds all photo data.
