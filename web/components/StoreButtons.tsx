/**
 * App Store / Google Play download buttons.
 *
 * These are lightweight on-brand buttons with inline glyphs. Before launch, swap
 * the hrefs for the real store URLs (set them once in lib/site.ts) — and ideally
 * replace these with the official Apple/Google badge assets to satisfy each
 * store's branding guidelines.
 */
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/site";

function AppleGlyph() {
  return (
    <svg viewBox="0 0 384 512" className="h-6 w-6" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C73.3 141.2 24 184.8 24 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.1 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M4 2.5v19a1 1 0 0 0 1.5.87l16-9.5a1 1 0 0 0 0-1.74l-16-9.5A1 1 0 0 0 4 2.5z"
      />
    </svg>
  );
}

function StoreButton({
  href,
  glyph,
  top,
  bottom,
  ariaLabel,
}: {
  href: string;
  glyph: React.ReactNode;
  top: string;
  bottom: string;
  ariaLabel: string;
}) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-line/50 hover:bg-white/10"
    >
      <span className="text-white/90">{glyph}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] uppercase tracking-wide text-fog">{top}</span>
        <span className="text-base font-semibold">{bottom}</span>
      </span>
    </a>
  );
}

export function StoreButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <StoreButton
        href={APP_STORE_URL}
        glyph={<AppleGlyph />}
        top="Download on the"
        bottom="App Store"
        ariaLabel="Download onelane on the App Store"
      />
      <StoreButton
        href={PLAY_STORE_URL}
        glyph={<PlayGlyph />}
        top="Get it on"
        bottom="Google Play"
        ariaLabel="Get onelane on Google Play"
      />
    </div>
  );
}
