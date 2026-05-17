export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-(--line) px-4 pb-14 pt-10 text-(--sea-ink-soft)">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div>
          <p className="m-0 text-sm">
            &copy; {year}{" "}
            <a
              href="https://github.com/musebe"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-(--sea-ink) hover:underline"
            >
              Eugene Musebe
            </a>
            . All rights reserved.
          </p>
          <p className="mt-1 text-xs">
            Built with{" "}
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              TanStack Start
            </a>{" "}
            &amp;{" "}
            <a
              href="https://cloudinary.com"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Cloudinary
            </a>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* GitHub repo */}
          <a
            href="https://github.com/musebe/tanstack-start-community-photo-wall"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-(--line) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--sea-ink-soft) transition hover:text-(--sea-ink)"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" width="14" height="14" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            View source
          </a>

          {/* Eugene's GitHub */}
          <a
            href="https://github.com/musebe"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl p-2 transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
            aria-label="Eugene Musebe on GitHub"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" width="20" height="20" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>

          {/* Cloudinary */}
          <a
            href="https://cloudinary.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl p-2 transition hover:bg-(--link-bg-hover) hover:text-(--sea-ink)"
            aria-label="Powered by Cloudinary"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="currentColor">
              <path d="M23.5 12.6c0 2.9-2.3 5.2-5.2 5.2h-1.1v-1.8h1.1c1.9 0 3.4-1.5 3.4-3.4 0-1.7-1.2-3.1-2.9-3.4l-.7-.1-.1-.7C17.6 6 15.7 4.4 13.5 4.4c-1.7 0-3.3.9-4.2 2.4l-.4.7-.7-.2c-.3-.1-.6-.1-.9-.1-2 0-3.6 1.6-3.6 3.6 0 .5.1 1 .3 1.5l.4.9-.9.2c-1.3.3-2.2 1.5-2.2 2.8 0 1.6 1.3 2.9 2.9 2.9h1.3v1.8H4.2C1.9 20.9 0 19 0 16.7c0-1.7 1-3.2 2.5-3.9-.1-.4-.1-.9-.1-1.3C2.4 8.4 4.8 6 7.8 6c.2 0 .4 0 .6.1C9.5 4.3 11.4 3.2 13.5 3.2c2.8 0 5.2 1.9 5.9 4.6 2.4.6 4.1 2.7 4.1 4.8z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
