import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/");

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="max-w-[20ch] text-center text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Everything You Need to Know Before Buying a Car at Auction
      </h1>
    </main>
  );
}
