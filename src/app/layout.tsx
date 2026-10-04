import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import { SiteBanner } from "@/components/SiteBanner";
import { getRoute } from "@/lib/routes";
import { site } from "@/lib/site";
import "./globals.css";

// Self-hosted by next/font at build time; globals.css puts it first in --font-sans.
const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  // No brand name yet, so pages carry their own title and the home page's is
  // the fallback for anything that sets none.
  title: { default: getRoute("/").title, template: "%s" },
  description: site.description,
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.language} className={workSans.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        <SiteBanner />
        {children}
      </body>
    </html>
  );
}
