import { createFileRoute } from "@tanstack/react-router";
import { UploadForm } from "../components/upload-form";
import { PipelinePanel } from "../components/pipeline-panel";

export const Route = createFileRoute("/upload")({ component: UploadPage });

function UploadPage() {
  return (
    <main className="page-wrap pb-16 pt-14">
      {/* Page header — medium width */}
      <div className="mx-auto max-w-2xl px-4">
        <p className="island-kicker mb-2">Community Uploads</p>
        <h1 className="display-title mb-2 text-3xl font-bold tracking-tight text-(--sea-ink) sm:text-4xl">
          Share a photo
        </h1>
        <p className="mb-10 text-sm text-(--sea-ink-soft)">
          Select an image from your device. We'll resize it, add a watermark, and send it for
          review. Once approved it will appear in the gallery.
        </p>
      </div>

      {/* Pipeline explainer — wider so each card has room */}
      <div className="mx-auto max-w-4xl px-4">
        <PipelinePanel />
      </div>

      {/* Upload form — narrower */}
      <div className="mx-auto mt-8 max-w-lg px-4">
        <UploadForm />
      </div>
    </main>
  );
}
