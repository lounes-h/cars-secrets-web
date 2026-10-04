import Link from "next/link";
import { redirect } from "next/navigation";
import { LocalTime } from "@/components/LocalTime";
import { LotFilters } from "@/components/LotFilters";
import { listPath, type Query, queryString, readQuery, searched } from "@/lib/lot-filters";
import {
  amount,
  getLotPreferences,
  interpretSearch,
  listLots,
  lotPath,
  odometer,
  offsiteAddress,
  pageCount,
  pageNumber,
  PAGE_SIZE,
  place,
  saleDate,
  vehicle,
  type LotPage,
} from "@/lib/lots";
import { metadataForRoute } from "@/lib/seo/metadata";
import { currentUser, sessionToken, visitorIp, visitorZone } from "@/lib/session";

export const metadata = metadataForRoute("/active-lots");

const count = new Intl.NumberFormat("en-US");

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AuctionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [user, token, params] = await Promise.all([currentUser(), sessionToken(), searchParams]);
  // Fetched here rather than in <Lots>: a nested async component would make the page a suspense
  // boundary for one table, and the page is nothing without it.
  const found = user && token ? await dealerLots(params, token) : null;

  return (
    <main className="flex-1 bg-white px-4 py-10 sm:px-6 lg:px-10">
      <h1>Active lots</h1>
      <p className="mt-3 max-w-[65ch] text-muted">
        Every active lot from the auctions we track, searchable by make, model, year, VIN or lot
        number and narrowed by sale date, title, condition and damage: what the car is, what it
        is worth, what it is bid up to and where it sells.
      </p>
      {found ? (
        <LotFilters query={found.query} total={found.total} usage={found.usage} remembered={found.remembered}>
          <Lots {...found} />
        </LotFilters>
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

/**
 * The lots a signed-in dealer asked for. A search that names a lot opens it, and one that names
 * a make, model or years becomes those filters; the bare list comes back as the dealer left it.
 */
async function dealerLots(params: SearchParams, token: string) {
  const query = readQuery(params);
  const page = pageNumber(params.page);
  const ip = await visitorIp();
  if (query.q) {
    const named = await interpretSearch(query.q[0], token, ip);
    if (named.lot) redirect(lotPath(named.lot));
    const filtered = searched(query, named);
    if (filtered) redirect(listPath(filtered));
  }
  const { filters, usage } = await getLotPreferences(token, ip);
  // No parameters at all: the dealer came from elsewhere, not from the filter bar, which always
  // sets an order. Kept filters that read as nothing would only lead back here.
  const saved = readQuery(new URLSearchParams(filters));
  if (Object.keys(params).length === 0 && Object.keys(saved).length) redirect(listPath(saved));
  const list = await listLots(query, page, token, ip, await visitorZone());
  return { query, page, usage, remembered: queryString(saved), ...list };
}

function Lots({ query, page, items, total }: { query: Query; page: number } & LotPage) {
  const pages = pageCount(total);
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  if (items.length === 0) {
    return <p className="mt-8">{total === 0 ? "No lots match these filters." : "No lots on this page."}</p>;
  }

  return (
    <>
      <div className="mt-6 overflow-x-auto">
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
                <td className="py-2 pr-4">{place(lot)}{offsiteAddress(lot) && " · Offsite"}</td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {lot.sale_at ? <LocalTime value={lot.sale_at} /> : lot.sale_date ? saleDate(lot.sale_date) : "Future sale"}
                </td>
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
        <PageLink href={listPath(query, page - 1)} enabled={page > 1}>
          Previous
        </PageLink>
        <p className="text-muted">
          {count.format(first)}–{count.format(first + items.length - 1)} of {count.format(total)}, page{" "}
          {count.format(page)} of {count.format(pages)}
        </p>
        <PageLink href={listPath(query, page + 1)} enabled={page < pages}>
          Next
        </PageLink>
      </nav>
    </>
  );
}

function PageLink({ href, enabled, children }: { href: string; enabled: boolean; children: string }) {
  if (!enabled) {
    return (
      <span aria-disabled="true" className="btn btn-outline opacity-50">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className="btn btn-outline">
      {children}
    </Link>
  );
}
