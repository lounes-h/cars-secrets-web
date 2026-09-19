import type { Metadata, Viewport } from "next";
import { Libre_Franklin } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { SiteBanner } from "@/components/SiteBanner";
import { organization, webSite } from "@/lib/seo/jsonld";
import { site } from "@/lib/site";
import "./globals.css";

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-libre-franklin",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f3" },
    { media: "(prefers-color-scheme: dark)", color: "#11181d" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.language} className={libreFranklin.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        <JsonLd data={[organization(), webSite()]} />
        <SiteBanner />
        {children}
      </body>
    </html>
  );
}
