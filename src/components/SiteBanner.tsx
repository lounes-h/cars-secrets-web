import Link from "next/link";
import { AccountNav } from "@/components/AccountNav";
import { site } from "@/lib/site";

/** Full-width top banner: the site name as plain text until there is a logo. */
export function SiteBanner() {
  return (
    <header className="w-full border-b border-line bg-surface">
      <div className="flex h-16 w-full items-center px-4 sm:px-6 lg:px-10">
        <Link href="/" className="font-semibold no-underline">
          {site.name}
        </Link>
        <AccountNav />
      </div>
    </header>
  );
}
