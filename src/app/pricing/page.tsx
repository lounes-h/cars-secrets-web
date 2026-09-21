import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/pricing");

export default function PricingPage() {
  return (
    <main className="px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <h1>Pricing</h1>
      <p className="max-w-[65ch]">What a Car&apos;s Secrets subscription costs, after seven days free. The plans are not decided yet.</p>
    </main>
  );
}
