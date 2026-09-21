import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/auctions");

/** Blank on purpose: the page is a placeholder until the feature behind it exists. */
export default function AuctionsPage() {
  return <main className="flex-1 bg-white" />;
}
