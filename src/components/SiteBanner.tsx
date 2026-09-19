import Link from "next/link";
import { site } from "@/lib/site";

/** Intrinsic size of the files in public/brand/ (trimmed, transparent, 3× the 36px display height). */
export const LOGO_SIZE = { width: 879, height: 120 } as const;

/**
 * Full-width top banner with the brand logo. The logos are 16-colour palette
 * PNGs of about 7 KB, smaller than what the Next image optimizer produces from
 * them, so they are served as-is. A <picture> swaps in the dark-mode logo
 * (white "Secrets") so only the variant for the current theme is downloaded,
 * and it loads eagerly because it is above the fold.
 */
export function SiteBanner() {
  return (
    <header className="w-full border-b border-line bg-surface">
      <div className="flex h-16 w-full items-center px-4 sm:h-[4.5rem] sm:px-6 lg:px-10">
        <Link href="/" className="-mx-1 rounded-sm px-1 py-1">
          <picture>
            <source media="(prefers-color-scheme: dark)" srcSet="/brand/logo-dark.png" />
            {/* A plain <img>: the image optimizer would make these PNGs larger. */}
            <img
              src="/brand/logo-light.png"
              alt={site.name}
              width={LOGO_SIZE.width}
              height={LOGO_SIZE.height}
              fetchPriority="high"
              decoding="async"
              className="h-7 w-auto sm:h-9"
            />
          </picture>
        </Link>
      </div>
    </header>
  );
}
