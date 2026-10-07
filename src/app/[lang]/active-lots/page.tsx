import Link from "next/link";
import { redirect } from "next/navigation";
import { LotCard } from "@/components/LotCard";
import { LotFilters } from "@/components/LotFilters";
import { buttonVariants } from "@/components/ui/button";
import { fill, formatCount, type I18n, localePath, pluralForm, rich } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
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

export const generateMetadata = () => metadataForRoute("/active-lots");

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AuctionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [i18n, user, token, params] = await Promise.all([getI18n(), currentUser(), sessionToken(), searchParams]);
  const { locale, m } = i18n;
  // Fetched here rather than in <Lots>: a nested async component would make the page a suspense
  // boundary for one table, and the page is nothing without it.
  const found = user && token ? await dealerLots(params, token, i18n) : null;

  return (
    <>
      {found?.activity && <ActivitySummary {...found.activity} i18n={i18n} />}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* No visible title or lede: the search comes first. The heading stays for screen readers. */}
        <h1 className="sr-only">{m.pages["/active-lots"].title}</h1>
        {found ? (
          <LotFilters query={found.query} total={found.total} usage={found.usage} remembered={found.remembered}>
            <Lots {...found} i18n={i18n} />
          </LotFilters>
        ) : (
          <p>
            <Link href={localePath("/login", locale)} className={buttonVariants()}>
              {m.lots.signIn}
            </Link>
          </p>
        )}
      </main>
    </>
  );
}

/** A strip under the menu: "11,821 new lots in the last 3 days", "14,769 lots updated today". */
function ActivitySummary({ added, updated, i18n: { locale, m } }: LotActivity & { i18n: I18n }) {
  const words = m.lots.activity;
  const line = (forms: typeof words.added, counts: LotActivity["added"]) => {
    const { count, window } = activityWindow(counts);
    return rich(pluralForm(locale, forms[window], count), { count: <strong>{formatCount(locale, count)}</strong> });
  };
  return (
    <section
      aria-label={words.label}
      className="flex flex-wrap gap-x-6 gap-y-1 border-b bg-muted px-4 py-2 text-sm sm:px-6 lg:px-8"
    >
      <p className="m-0">{line(words.added, added)}</p>
      <p className="m-0">{line(words.updated, updated)}</p>
    </section>
  );
}

/**
 * The lots a signed-in dealer asked for. A search that names a lot opens it, and one that names
 * a make, model or years becomes those filters; the bare list comes back as the dealer left it.
 */
async function dealerLots(params: SearchParams, token: string, { locale }: I18n) {
  const query = readQuery(params);
  const page = pageNumber(params.page);
  const ip = await visitorIp();
  if (query.q) {
    const named = await interpretSearch(query.q[0], token, ip);
    if (named.lot) redirect(localePath(lotPath(named.lot), locale));
    const filtered = searched(query, named);
    if (filtered) redirect(localePath(listPath(filtered), locale));
  }
  const { filters, usage } = await getLotPreferences(token, ip);
  // No parameters at all: the dealer came from elsewhere, not from the filter bar, which always
  // sets an order. Kept filters that read as nothing would only lead back here.
  const saved = readQuery(new URLSearchParams(filters));
  if (Object.keys(params).length === 0 && Object.keys(saved).length) redirect(localePath(listPath(saved), locale));
  const zone = await visitorZone();
  const [list, activity] = await Promise.all([
    listLots(query, page, token, ip, zone),
    // The summary is extra: the list stands without it.
    getLotActivity(token, ip, zone).catch(() => null),
  ]);
  return { query, page, usage, remembered: queryString(saved), activity, ...list };
}

function Lots({ query, page, items, total, i18n }: { query: Query; page: number; i18n: I18n } & LotPage) {
  const { locale, m } = i18n;
  const pages = pageCount(total);
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const n = (value: number) => formatCount(locale, value);

  if (items.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        {total === 0 ? m.lots.noMatch : m.lots.emptyPage}
      </p>
    );
  }

  return (
    <>
      <ul aria-label={m.lots.list} className="mt-6 flex flex-col gap-4">
        {items.map((lot) => (
          <li key={`${lot.source}-${lot.lot_number}`}>
            <LotCard lot={lot} i18n={i18n} />
          </li>
        ))}
      </ul>
      <nav aria-label={m.lots.pagination} className="mt-6 flex items-center gap-4">
        <PageLink href={localePath(listPath(query, page - 1), locale)} enabled={page > 1}>
          {m.lots.previous}
        </PageLink>
        <p className="text-muted-foreground">
          {fill(m.lots.range, { first: n(first), last: n(first + items.length - 1), total: n(total), page: n(page), pages: n(pages) })}
        </p>
        <PageLink href={localePath(listPath(query, page + 1), locale)} enabled={page < pages}>
          {m.lots.next}
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
