import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  return (
    <main className="page-wrap px-4 pb-20 pt-14">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-14 sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.28),transparent_60%)]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.16),transparent_60%)]" />

        <p className="island-kicker mb-3">TanStack Start · Cloudinary</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-(--sea-ink) sm:text-5xl lg:text-6xl">
          Build a community photo wall — the right way.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-(--sea-ink-soft) sm:text-lg">
          Users upload anything. Your app resizes it, watermarks it, and only
          shows approved photos. Cloudinary handles the hard part — you handle
          the experience.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/upload">Upload a Photo</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/gallery">Browse Gallery</Link>
          </Button>
        </div>
      </section>

      {/* ── The problem / solution ────────────────────────── */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="island-shell feature-card rise-in rounded-2xl p-6" style={{ animationDelay: "80ms" }}>
          <p className="island-kicker mb-2">The problem</p>
          <p className="text-sm text-(--sea-ink-soft)">
            Managing user-generated content is scary. Users upload huge files,
            wrong formats, or portraits that crop terribly. You need to resize,
            watermark, and moderate — before anything hits your storage.
          </p>
        </div>
        <div className="island-shell feature-card rise-in rounded-2xl p-6" style={{ animationDelay: "160ms" }}>
          <p className="island-kicker mb-2">The solution</p>
          <p className="text-sm text-(--sea-ink-soft)">
            <strong className="text-(--sea-ink)">Cloudinary incoming transformations</strong>{" "}
            fire the moment a file arrives — not at request time. The stored
            image is already resized, watermarked, and face-cropped.
          </p>
        </div>
      </section>

      {/* ── Cloudinary features grid ──────────────────────── */}
      <section className="mt-10">
        <p className="island-kicker mb-1">Cloudinary powers every upload</p>
        <h2 className="display-title mb-6 text-2xl font-bold tracking-tight text-(--sea-ink) sm:text-3xl">
          Four features, zero effort on your part
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CLOUDINARY_FEATURES.map(({ icon, title, tag, desc }, i) => (
            <article
              key={title}
              className="island-shell feature-card rise-in flex flex-col rounded-2xl p-5"
              style={{ animationDelay: `${i * 70 + 80}ms` }}
            >
              <span className="mb-3 text-3xl">{icon}</span>
              <h3 className="mb-1 text-sm font-semibold text-(--sea-ink)">{title}</h3>
              <code className="mb-2 self-start rounded-md bg-black/5 px-2 py-0.5 font-mono text-[11px] text-(--lagoon-deep) dark:bg-white/10">
                {tag}
              </code>
              <p className="text-xs text-(--sea-ink-soft)">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Upload pipeline visual ────────────────────────── */}
      <section className="island-shell mt-10 rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-1">Incoming transformations</p>
        <h2 className="display-title mb-2 text-xl font-bold text-(--sea-ink) sm:text-2xl">
          Applied once, at upload time
        </h2>
        <p className="mb-6 max-w-2xl text-sm text-(--sea-ink-soft)">
          Unlike eager or on-the-fly transforms, incoming transformations run
          before the file is stored. The result is baked in — delivery is instant
          and there are no per-request compute costs.
        </p>

        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-2">
            {PIPELINE.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1.5 rounded-xl border border-(--line) bg-(--surface) px-4 py-3 text-center">
                  <span className="text-xl">{step.icon}</span>
                  <span className="text-xs font-semibold text-(--sea-ink)">{step.label}</span>
                  {step.param && (
                    <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] text-(--lagoon-deep) dark:bg-white/10">
                      {step.param}
                    </code>
                  )}
                </div>
                {i < PIPELINE.length - 1 && (
                  <span className="text-sm text-(--lagoon)">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Moderation explainer ──────────────────────────── */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {MODERATION_STEPS.map(({ icon, status, label, desc, style }, i) => (
          <div
            key={status}
            className="island-shell rise-in rounded-2xl p-5"
            style={{ animationDelay: `${i * 80 + 80}ms` }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
                {status}
              </span>
            </div>
            <p className="mb-0.5 text-sm font-semibold text-(--sea-ink)">{label}</p>
            <p className="text-xs text-(--sea-ink-soft)">{desc}</p>
          </div>
        ))}
      </section>

    </main>
  );
}

/* ─── Data ─────────────────────────────────────────────────────────── */

const CLOUDINARY_FEATURES = [
  {
    icon: "🔄",
    title: "Incoming Transformations",
    tag: "transformation: [...]",
    desc: "Resize, crop, and optimise the moment the file lands — before it is stored. No per-request cost.",
  },
  {
    icon: "👤",
    title: "Face Detection Crop",
    tag: "g_auto:faces",
    desc: "Gravity set to auto:faces so the crop always centres on the most prominent detected face.",
  },
  {
    icon: "💧",
    title: "Logo Watermark",
    tag: "l_logo / text overlay",
    desc: "Your brand stamp is baked into the stored file at upload time — not rendered at delivery.",
  },
  {
    icon: "⚡",
    title: "Auto Format & Quality",
    tag: "f_auto, q_auto",
    desc: "Serve WebP or AVIF based on browser support. Cloudinary picks the smallest file with good fidelity.",
  },
];

const PIPELINE = [
  { icon: "📁", label: "User file", param: null },
  { icon: "🛡️", label: "Client check", param: "type + size" },
  { icon: "☁", label: "Cloudinary", param: "upload_stream" },
  { icon: "↔", label: "Resize", param: "c_fill, w_800" },
  { icon: "👤", label: "Face crop", param: "g_auto:faces" },
  { icon: "💧", label: "Watermark", param: "l_logo" },
  { icon: "⚡", label: "Optimise", param: "f_auto, q_auto" },
  { icon: "🗄️", label: "Stored", param: "pending" },
];

const MODERATION_STEPS = [
  {
    icon: "⏳",
    status: "pending",
    style: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    label: "Awaiting review",
    desc: "Every upload starts here. The photo is stored and processed but not yet public.",
  },
  {
    icon: "✅",
    status: "approved",
    style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    label: "Visible in gallery",
    desc: "Moderator approved it. The photo appears on the public wall for everyone to see.",
  },
  {
    icon: "🚫",
    status: "rejected",
    style: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    label: "Hidden from gallery",
    desc: "Moderator rejected it. The photo stays stored but never appears publicly.",
  },
];
