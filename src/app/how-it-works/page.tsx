import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/how-it-works");

export default function HowItWorksPage() {
  return (
    <main className="px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <h1>How it works</h1>
      <p className="max-w-[65ch]">Car&apos;s Secrets reads the live auction listings, estimates what each lot resells for, subtracts what it costs to buy, repair and move, and tells you the most you should bid. This page will explain each step.</p>
    </main>
  );
}
