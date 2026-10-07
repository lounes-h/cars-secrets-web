import { getI18n } from "@/lib/i18n-server";

/** A 404 in the page's language, under the banner: a path no page matches, or a lot the API no longer has. */
export default async function NotFound() {
  const { m } = await getI18n();
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-center text-2xl font-semibold">{m.notFound}</h1>
    </main>
  );
}
