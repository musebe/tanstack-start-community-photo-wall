import { Link } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-(--line) bg-(--header-bg) px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        {/* Logo / brand */}
        <h2 className="m-0 shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm text-(--sea-ink) no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-linear-to-r from-[#56c6be] to-[#7ed3bf]" />
            PhotoWall
          </Link>
        </h2>

        {/* Navigation links */}
        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-0 sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link
            to="/gallery"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Gallery
          </Link>
          <Link
            to="/upload"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Upload
          </Link>
          <Link
            to="/moderate"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Moderate
          </Link>
        </div>

        {/* Right-side actions */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
