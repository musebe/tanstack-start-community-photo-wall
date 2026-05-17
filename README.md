# Community Photo Wall

A beginner-friendly UGC (user-generated content) app built with **TanStack Start**, **Cloudinary**, **ShadCN UI**, and **Tailwind CSS v4**.

Community members upload photos, Cloudinary processes them (resize + watermark), and a simple moderation layer decides which photos appear on the public gallery.

---

## What the app does

| Route | What it shows |
|---|---|
| `/` | Landing page — explains the app and links to Upload & Gallery |
| `/upload` | Upload form — validates file type & size, sends to Cloudinary |
| `/gallery` | Public photo wall — only **approved** photos are shown |

---

## Tech stack

- [TanStack Start](https://tanstack.com/start) — full-stack React framework
- [TanStack Router](https://tanstack.com/router) — type-safe file-based routing
- [Cloudinary](https://cloudinary.com) — image upload, resize, crop, watermark
- [ShadCN UI](https://ui.shadcn.com) — accessible component library
- [Tailwind CSS v4](https://tailwindcss.com) — utility-first styling

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Add your Cloudinary credentials

Copy `.env.local` (already provided) and fill in your values:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional — public_id of a logo image uploaded to Cloudinary.
# Leave empty to use the default "© PhotoWall" text watermark.
CLOUDINARY_WATERMARK_PUBLIC_ID=
```

You can find these values in the [Cloudinary Console](https://cloudinary.com/console) under **Dashboard → API Keys**.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How Cloudinary is used

Every upload goes through `src/lib/cloudinary.ts`. The key transformations applied before the image is stored:

1. **Resize** — the image is scaled to fit within 800 × 800 px.
2. **Face-detect crop** — `gravity: "auto:faces"` centres the crop on detected faces, so portraits look good.
3. **Watermark** — either a logo image (if `CLOUDINARY_WATERMARK_PUBLIC_ID` is set) or a text overlay `© PhotoWall` is placed in the bottom-right corner.
4. **Format & quality** — converted to WebP with `quality: "auto"` for smaller file sizes.

---

## How moderation works (demo)

This demo uses an **in-memory store** (`src/lib/mock-photos.ts`) instead of a real database. Every upload is saved with `status: "pending"` and does **not** appear in the gallery immediately.

To simulate approval, you can edit the store directly — or extend the app with an admin route that calls `updatePhotoStatus(id, "approved")`.

When you are ready to add persistence, swap `mock-photos.ts` for a Prisma (or any ORM) adapter — the rest of the app does not change.

```
pending  →  approved  (visible in gallery)
         →  rejected  (hidden)
```

---

## Project structure

```
src/
  actions/
    upload.action.ts     # Server function: validates → uploads to Cloudinary → saves
  components/
    ui/                  # ShadCN UI primitives (Button, Card, Badge)
    photo-card.tsx       # Single photo card with status badge
    photo-wall.tsx       # Responsive grid of photo cards
    upload-form.tsx      # File picker + validation + upload logic
  lib/
    cloudinary.ts        # Cloudinary SDK config & upload helper
    mock-photos.ts       # In-memory photo store (swap for DB later)
    utils.ts             # cn(), formatDate(), file validation
  routes/
    __root.tsx           # Root layout (header, footer, scripts)
    index.tsx            # Home page (/)
    upload.tsx           # Upload page (/upload)
    gallery.tsx          # Gallery page (/gallery)
  types/
    photo.ts             # Photo & CloudinaryUploadResult types
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm test` | Run unit tests with Vitest |
