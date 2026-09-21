import Link from "next/link";
import { AccountNav } from "@/components/AccountNav";
import { site } from "@/lib/site";

/** Intrinsic size of the wordmark files in public/brand/ (trimmed, transparent). */
export const LOGO_SIZE = { width: 1024, height: 144 } as const;
/** Intrinsic size of the square "C" mark the banner falls back to on phones. */
export const MARK_SIZE = { width: 144, height: 144 } as const;

/**
 * Full-width top banner with the brand logo. The files are 16-colour palette
 * PNGs, smaller than what the Next image optimizer produces from them, so they
 * are served as-is. The wordmark is seven times wider than it is tall and would
 * crowd the account navigation on a phone, so <picture> serves the square "C"
 * below 640px and the wordmark above it, each in a light and a dark variant.
 * Only the source matching the viewport and colour scheme is downloaded, and it
 * loads eagerly because it is above the fold.
 */
export function SiteBanner() {
  return (
    <header className="w-full border-b border-line bg-surface">
      <div className="flex h-16 w-full items-center px-4 sm:h-[4.5rem] sm:px-6 lg:px-10">
        <Link href="/" className="-mx-1 rounded-sm px-1 py-1 no-underline">
          <picture>
            <source
              media="(min-width: 640px) and (prefers-color-scheme: dark)"
              srcSet="/brand/logo-dark.png"
              width={LOGO_SIZE.width}
              height={LOGO_SIZE.height}
            />
            <source
              media="(min-width: 640px)"
              srcSet="/brand/logo-light.png"
              width={LOGO_SIZE.width}
              height={LOGO_SIZE.height}
            />
            <source media="(prefers-color-scheme: dark)" srcSet="/brand/mark-dark.png" />
            {/* A plain <img>: the image optimizer would make these PNGs larger. */}
            <img
              src="/brand/mark-light.png"
              alt={site.name}
              width={MARK_SIZE.width}
              height={MARK_SIZE.height}
              fetchPriority="high"
              decoding="async"
              className="h-8 w-auto sm:h-7 lg:h-8"
            />
          </picture>
        </Link>
        <AccountNav />
      </div>
    </header>
  );
}
