import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/alerts");

export default function AlertsPage() {
  return (
    <main className="px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
      <h1>Your alerts</h1>
      <p className="max-w-[65ch]">Alerts tell you when a lot matching one of your saved searches comes up for auction. Alerts are not built yet.</p>
    </main>
  );
}
