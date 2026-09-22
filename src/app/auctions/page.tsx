import Link from "next/link";
import { listLots, pageCount, pageNumber, PAGE_SIZE, type Lot, type LotPage } from "@/lib/lots";
import { metadataForRoute } from "@/lib/seo/metadata";
import { currentUser, sessionToken, visitorIp } from "@/lib/session";

export const metadata = metadataForRoute("/auctions");

const miles = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const count = new Intl.NumberFormat("en-US");
/** Sale times are the auction's own; UTC keeps server and browser rendering the same string. */
const when = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

/** The lot's own currency, ignored unless it is a currency code Intl accepts. */
function amount(value: number | null, currency: string | null): string {
  if (value == null) return "—";
  const code = currency && /^[A-Z]{3}$/.test(currency) ? currency : "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(value);
}

function vehicle(lot: Lot): string {
  return [lot.year, lot.make, lot.model].filter(Boolean).join(" ") || "—";
}

function place(lot: Lot): string {
  return [lot.location_city, lot.location_state].filter(Boolean).join(", ") || "—";
}

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
      <h1>Auction lots</h1>
      <p className="mt-3 max-w-[65ch] text-muted">
        Every active lot from the auctions we track, soonest sale first: what the car is, what it
        is worth, what it is bid up to and where it sells.
      </p>
      {found ? <Lots page={page} {...found} /> : <SignInFirst />}
    </main>
  );
}

function SignInFirst() {
  return (
    <p className="mt-8">
      <Link href="/login" className="btn btn-primary">
        Sign in to see the lots
      </Link>
    </p>
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
                  {lot.listing_url ? (
                    <a href={lot.listing_url} rel="noopener noreferrer nofollow" target="_blank">
                      {lot.lot_number}
                    </a>
                  ) : (
                    lot.lot_number
                  )}
                </td>
                <td className="py-2 pr-4">{vehicle(lot)}</td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {lot.odometer == null ? "—" : `${miles.format(lot.odometer)} mi`}
                </td>
                <td className="py-2 pr-4">{lot.damage_primary ?? "—"}</td>
                <td className="py-2 pr-4">{lot.title_type ?? "—"}</td>
                <td className="py-2 pr-4">{place(lot)}</td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {lot.sale_at ? when.format(new Date(lot.sale_at)) : "—"}
                </td>
                <td className="py-2 pr-4 text-right whitespace-nowrap">{amount(lot.est_retail_value, lot.currency)}</td>
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

function PageLink({
  page,
  enabled,
  children,
}: {
  page: number;
  enabled: boolean;
  children: string;
}) {
  if (!enabled) {
    return (
      <span aria-disabled="true" className="btn btn-outline opacity-50">
        {children}
      </span>
    );
  }
  return (
    <Link href={page > 1 ? `/auctions?page=${page}` : "/auctions"} className="btn btn-outline">
      {children}
    </Link>
  );
}
