import { metadataForRoute } from "@/lib/seo/metadata";

export const generateMetadata = () => metadataForRoute("/how-it-works");

/** Blank on purpose: the page is a placeholder until the feature behind it exists. */
export default function HowItWorksPage() {
  return <main className="flex-1" />;
}
