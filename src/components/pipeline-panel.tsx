import React from "react";

const STEPS = [
  {
    icon: "🛡️",
    label: "Client check",
    detail: "File type & 5 MB limit enforced before anything leaves the browser.",
    code: null,
  },
  {
    icon: "☁",
    label: "Cloudinary",
    detail: "Incoming transformations applied at upload — not at request time.",
    code: "c_fill, g_auto:faces\nw_800, h_800\nl_watermark, g_south_east\nf_auto, q_auto",
  },
  {
    icon: "🔍",
    label: "Moderation",
    detail: "Saved as pending. Appears in the gallery once a moderator approves.",
    code: null,
  },
];

/**
 * Three-step pipeline explainer shown above the upload form.
 * Uses a 3-column grid with fixed-width arrow columns so all three
 * cards stay equal width regardless of their content.
 */
export function PipelinePanel() {
  return (
    <div className="island-shell rounded-2xl p-6">
      <p className="island-kicker mb-5">The upload pipeline</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_28px_1fr_28px_1fr]">
        {STEPS.map((step, i) => (
          <React.Fragment key={step.label}>
            {/* Card */}
            <div className="flex flex-col gap-3 rounded-xl border border-(--line) bg-(--surface) p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--lagoon)/10 text-xl">
                  {step.icon}
                </span>
                <span className="text-sm font-bold text-(--sea-ink)">{step.label}</span>
              </div>
              <p className="text-xs leading-relaxed text-(--sea-ink-soft)">{step.detail}</p>
              {step.code && (
                <pre className="overflow-x-auto rounded-lg bg-black/5 p-3 font-mono text-[11px] leading-loose text-(--lagoon-deep) dark:bg-white/5">
                  {step.code}
                </pre>
              )}
            </div>

            {/* Arrow separator (desktop only) */}
            {i < STEPS.length - 1 && (
              <div className="hidden items-center justify-center text-lg font-light text-(--lagoon) sm:flex">
                →
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
