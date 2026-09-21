import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/vin-lookup");

/** Blank on purpose: the page is a placeholder until the feature behind it exists. */
export default function VinLookupPage() {
  return <main className="flex-1 bg-white" />;
}
