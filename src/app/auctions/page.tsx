import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/auctions");

export default function AuctionsPage() {
  return (
    <main className="px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <h1>Auction lots</h1>
      <p className="max-w-[65ch]">Every active lot from Copart, IAA, Manheim and the other auction sources, in one searchable list. The listings are not connected yet.</p>
    </main>
  );
}
