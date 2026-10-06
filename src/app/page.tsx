import { metadataForRoute } from "@/lib/seo/metadata";

export const metadata = metadataForRoute("/");

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24 sm:px-6 lg:px-10">
      <h1 className="max-w-[20ch] text-center text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
        Everything You Need to Know Before Buying a Car at Auction
      </h1>
    </main>
  );
}
