import { getI18n } from "@/lib/i18n-server";
import { metadataForRoute } from "@/lib/seo/metadata";

export const generateMetadata = () => metadataForRoute("/");

export default async function HomePage() {
  const { m } = await getI18n();
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="max-w-[20ch] text-center text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {m.pages["/"].title}
      </h1>
    </main>
  );
}
