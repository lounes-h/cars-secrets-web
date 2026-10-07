import Image from "next/image";
import Link from "next/link";
import { AccountNav } from "@/components/AccountNav";
import { type Locale, localePath } from "@/lib/i18n";

/** Full-width top banner: the CarBidInsight wordmark links home, in the page's language. */
export function SiteBanner({ locale }: { locale: Locale }) {
  return (
    <header className="w-full border-b bg-background">
      <div className="flex h-16 w-full items-center px-4 sm:px-6 lg:px-8">
        <Link href={localePath("/", locale)} className="no-underline">
          {/* 2× the 192×32 it is shown at, already compressed (6.7 KB): the optimizer only made it bigger. */}
          <Image src="/logo.png" alt="CarBidInsight" width={192} height={32} preload unoptimized />
        </Link>
        <AccountNav />
      </div>
    </header>
  );
}
