import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/saved");

export default function SavedPage() {
  return (
    <main className="px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <h1>Saved lots and searches</h1>
      <p className="max-w-[65ch]">The lots and searches you saved, so you can come back to them before the auction closes. Saving is not built yet.</p>
    </main>
  );
}
