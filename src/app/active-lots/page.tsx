import Link from "next/link";
import { redirect } from "next/navigation";
import { LotCard } from "@/components/LotCard";
import { LotFilters } from "@/components/LotFilters";
import { buttonVariants } from "@/components/ui/button";
import { listPath, type Query, queryString, readQuery, searched } from "@/lib/lot-filters";
import {
  activityWindow,
  getLotActivity,
  getLotPreferences,
  interpretSearch,
  listLots,
  lotPath,
  pageCount,
  pageNumber,
  PAGE_SIZE,
  type LotActivity,
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
    <>
      {found?.activity && <ActivitySummary {...found.activity} />}
      <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10">
        {/* No visible title or lede: the search comes first. The heading stays for screen readers. */}
        <h1 className="sr-only">Active lots</h1>
        {found ? (
          <LotFilters query={found.query} total={found.total} usage={found.usage} remembered={found.remembered}>
            <Lots {...found} />
          </LotFilters>
        ) : (
          <p>
            <Link href="/login" className={buttonVariants()}>
              Sign in to see the lots
            </Link>
          </p>
        )}
      </main>
    </>
  );
}

/** A strip under the menu: "11,821 new lots in the last 3 days", "14,769 lots updated today". */
function ActivitySummary({ added, updated }: LotActivity) {
  const fresh = activityWindow(added);
  const changed = activityWindow(updated);
  const lots = (n: number) => (n === 1 ? "lot" : "lots");
  return (
    <section
      aria-label="Lot activity"
      className="flex flex-wrap gap-x-6 gap-y-1 border-b bg-muted px-4 py-2.5 text-sm sm:px-6 lg:px-10"
    >
      <p className="m-0">
        <strong>{count.format(fresh.count)}</strong> new {lots(fresh.count)} {fresh.words}
      </p>
      <p className="m-0">
        <strong>{count.format(changed.count)}</strong> {lots(changed.count)} updated {changed.words}
      </p>
    </section>
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
  const zone = await visitorZone();
  const [list, activity] = await Promise.all([
    listLots(query, page, token, ip, zone),
    // The summary is extra: the list stands without it.
    getLotActivity(token, ip, zone).catch(() => null),
  ]);
  return { query, page, usage, remembered: queryString(saved), activity, ...list };
}

function Lots({ query, page, items, total }: { query: Query; page: number } & LotPage) {
  const pages = pageCount(total);
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  if (items.length === 0) {
    return <p className="mt-8">{total === 0 ? "No lots match these filters." : "No lots on this page."}</p>;
  }

  return (
    <>
      <ul aria-label="Lots" className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4">
        {items.map((lot) => (
          <li key={`${lot.source}-${lot.lot_number}`}>
            <LotCard lot={lot} />
          </li>
        ))}
      </ul>
      <nav aria-label="Pagination" className="mt-6 flex items-center gap-4">
        <PageLink href={listPath(query, page - 1)} enabled={page > 1}>
          Previous
        </PageLink>
        <p className="text-muted-foreground">
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
      <span aria-disabled="true" className={buttonVariants({ variant: "outline", className: "opacity-50" })}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={buttonVariants({ variant: "outline" })}>
      {children}
    </Link>
  );
}
