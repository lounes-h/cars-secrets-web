import Image from "next/image";
import Link from "next/link";

// Only pages that exist: About, Contact, Terms and Privacy join when they are written.
const LINKS = [
  { href: "/active-lots", label: "Active lots" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
];

/** Full-width footer on every page: the logo links home, then the site's main pages. */
export function SiteFooter() {
  return (
    <footer className="flex w-full flex-wrap items-center gap-x-8 gap-y-4 border-t border-line bg-surface px-4 py-8 sm:px-6 lg:px-10">
      <Link href="/" className="no-underline">
        <Image src="/logo.png" alt="CarBidInsight" width={144} height={24} unoptimized />
      </Link>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm text-muted no-underline hover:text-ink">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
