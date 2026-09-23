import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import {
  amount,
  listLots,
  lotPath,
  odometer,
  pageCount,
  pageNumber,
  PAGE_SIZE,
  place,
  vehicle,
  type LotPage,
} from "@/lib/lots";
import { metadataForRoute } from "@/lib/seo/metadata";
import { currentUser, sessionToken, visitorIp } from "@/lib/session";

export const metadata = metadataForRoute("/active-lots");

const count = new Intl.NumberFormat("en-US");

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [user, token, { page: raw }] = await Promise.all([currentUser(), sessionToken(), searchParams]);
  const page = pageNumber(raw);
  // Fetched here rather than in <Lots>: a nested async component would make the page a suspense
  // boundary for one table, and the page is nothing without it.
  const found = user && token ? await listLots(page, token, await visitorIp()) : null;

  return (
    <main className="flex-1 bg-white px-4 py-10 sm:px-6 lg:px-10">
      <h1>Active lots</h1>
      <p className="mt-3 max-w-[65ch] text-muted">
        Every active lot from the auctions we track, the most recently listed first: what the car
        is, what it is worth, what it is bid up to and where it sells.
      </p>
      {found ? (
        <Lots page={page} {...found} />
      ) : (
        <p className="mt-8">
          <Link href="/login" className="btn btn-primary">
            Sign in to see the lots
          </Link>
        </p>
      )}
    </main>
  );
}

function Lots({ page, items, total }: { page: number } & LotPage) {
  const pages = pageCount(total);
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  if (items.length === 0) {
    return <p className="mt-8">No lots on this page.</p>;
  }

  return (
    <>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-[0.9375rem]">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="py-2 pr-4 font-medium">Lot</th>
              <th scope="col" className="py-2 pr-4 font-medium">Vehicle</th>
              <th scope="col" className="py-2 pr-4 font-medium">Odometer</th>
              <th scope="col" className="py-2 pr-4 font-medium">Damage</th>
              <th scope="col" className="py-2 pr-4 font-medium">Title</th>
              <th scope="col" className="py-2 pr-4 font-medium">Location</th>
              <th scope="col" className="py-2 pr-4 font-medium">Sale</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Est. retail</th>
              <th scope="col" className="py-2 text-right font-medium">High bid</th>
            </tr>
          </thead>
          <tbody>
            {items.map((lot) => (
              <tr key={`${lot.source}-${lot.lot_number}`} className="border-b border-line align-top">
                <td className="py-2 pr-4 whitespace-nowrap">
                  <Link href={lotPath(lot)}>{lot.lot_number}</Link>
                </td>
                <td className="py-2 pr-4">{vehicle(lot)}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{odometer(lot.odometer)}</td>
                <td className="py-2 pr-4">{lot.damage_primary ?? "—"}</td>
                <td className="py-2 pr-4">{lot.title_type ?? "—"}</td>
                <td className="py-2 pr-4">{place(lot)}</td>
                <td className="py-2 pr-4 whitespace-nowrap"><LocalTime value={lot.sale_at} /></td>
                <td className="py-2 pr-4 text-right whitespace-nowrap">
                  {amount(lot.est_retail_value, lot.currency)}
                </td>
                <td className="py-2 text-right whitespace-nowrap">{amount(lot.high_bid, lot.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav aria-label="Pagination" className="mt-6 flex items-center gap-4">
        <PageLink page={page - 1} enabled={page > 1}>
          Previous
        </PageLink>
        <p className="text-muted">
          {count.format(first)}–{count.format(first + items.length - 1)} of {count.format(total)}, page{" "}
          {count.format(page)} of {count.format(pages)}
        </p>
        <PageLink page={page + 1} enabled={page < pages}>
          Next
        </PageLink>
      </nav>
    </>
  );
}

function PageLink({ page, enabled, children }: { page: number; enabled: boolean; children: string }) {
  if (!enabled) {
    return (
      <span aria-disabled="true" className="btn btn-outline opacity-50">
        {children}
      </span>
    );
  }
  return (
    <Link href={page > 1 ? `/active-lots?page=${page}` : "/active-lots"} className="btn btn-outline">
      {children}
    </Link>
  );
}
