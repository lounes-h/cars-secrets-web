import Link from "next/link";
import { AccountNav } from "@/components/AccountNav";

/** Full-width top banner. There is no brand name or logo yet, so the link home reads "Home". */
export function SiteBanner() {
  return (
    <header className="w-full border-b border-line bg-surface">
      <div className="flex h-16 w-full items-center px-4 sm:px-6 lg:px-10">
        <Link href="/" className="font-semibold no-underline">
          Home
        </Link>
        <AccountNav />
      </div>
    </header>
  );
}
