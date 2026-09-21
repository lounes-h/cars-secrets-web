import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/vin-lookup");

export default function VinLookupPage() {
  return (
    <main className="px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <h1>VIN lookup</h1>
      <p className="max-w-[65ch]">Type a VIN to see what that lot is, what it is worth and what it would cost you to buy it. The lookup is not connected yet.</p>
    </main>
  );
}
