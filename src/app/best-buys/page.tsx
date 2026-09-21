import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/best-buys");

export default function BestBuysPage() {
  return (
    <main className="px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <h1>Best buys</h1>
      <p className="max-w-[65ch]">The active lots with the strongest projected profit and margin, ranked for you. The ranking is not connected yet.</p>
    </main>
  );
}
