import Link from "next/link";

/**
 * Shared shell for static content pages (privacy, support): a minimal header
 * that links home, a titled article container with readable "prose" styling, and
 * a small footer. Prose styling is applied via Tailwind child-selector utilities
 * so page bodies can be written as plain semantic HTML (h2/h3/p/ul/a/strong).
 */
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-line">
        <span className="h-3 w-[3px] rounded-full bg-ink" />
      </span>
      <span className="text-lg font-semibold tracking-tight">onelane</span>
    </div>
  );
}

const prose = [
  "space-y-5 text-fog",
  "[&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white",
  "[&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white",
  "[&_p]:leading-relaxed",
  "[&_a]:text-line [&_a]:underline [&_a]:underline-offset-2",
  "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6",
  "[&_li]:leading-relaxed [&_li]:marker:text-line",
  "[&_strong]:font-semibold [&_strong]:text-white",
].join(" ");

export function ContentPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label="onelane home">
          <Logo />
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-fog transition hover:text-line"
        >
          ← Back home
        </Link>
      </header>

      <article className="mx-auto max-w-3xl px-6 pb-20 pt-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {updated && (
          <p className="mt-4 text-sm text-fog">Last updated: {updated}</p>
        )}
        {intro && <p className="mt-6 text-lg leading-relaxed text-fog">{intro}</p>}
        <div className={`mt-10 ${prose}`}>{children}</div>
      </article>

      <footer className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-fog sm:flex-row">
          <Logo />
          <nav className="flex items-center gap-5">
            <Link href="/privacy" className="transition hover:text-line">
              Privacy
            </Link>
            <Link href="/support" className="transition hover:text-line">
              Support
            </Link>
            <span>© 2026 onelane</span>
          </nav>
        </div>
      </footer>
    </main>
  );
}
