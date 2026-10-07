import { metadataForRoute } from "@/lib/seo/metadata";

export const generateMetadata = () => metadataForRoute("/settings");

/** Blank on purpose: the page is a placeholder until the feature behind it exists. */
export default function SettingsPage() {
  return <main className="flex-1" />;
}
