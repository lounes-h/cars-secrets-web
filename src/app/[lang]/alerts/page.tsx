import Link from "next/link";
import { markAllAlertsReadAction } from "@/app/[lang]/alerts/actions";
import { AlertEntry } from "@/components/AlertEntry";
import { LocalTime } from "@/components/LocalTime";
import { Button, buttonVariants } from "@/components/ui/button";
import { type Alert, ALERT_KINDS, type AlertKind, ALERTS_PAGE, getAlerts, isAlertKind, type LotChanges, type LotSummary, type SaleTime } from "@/lib/alerts";
import { fill, formatCount, type I18n, LOCALES, localePath, plural, pluralForm, rich } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { listPath, readQuery } from "@/lib/lot-filters";
import { amount, auctionName, lotPath, pageNumber, place, saleDate } from "@/lib/lots";
import { keyOf } from "@/lib/saved";
import { metadataForRoute } from "@/lib/seo/metadata";
import { currentUser, sessionToken, visitorIp } from "@/lib/session";

export const generateMetadata = () => metadataForRoute("/alerts");

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * The dealer's inbox, newest first, grouped as the emails are: a summary's new matches by saved
 * search, a run's saved-lot changes, and each auction reminder. Following a link in an unread
 * alert marks it read.
 */
export default async function AlertsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [i18n, user, token, params] = await Promise.all([getI18n(), currentUser(), sessionToken(), searchParams]);
  const { locale, m } = i18n;
  const words = m.alerts;
  if (!user || !token) {
    return (
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <h1>{m.pages["/alerts"].title}</h1>
        <p className="mt-8">
          <Link href={localePath("/login", locale)} className={buttonVariants()}>
            {words.signIn}
          </Link>
        </p>
      </main>
    );
  }
  const kind = isAlertKind(params.kind) ? params.kind : null;
  const page = pageNumber(params.page);
  const found = await getAlerts(kind, page, token, await visitorIp());
  const pages = Math.max(1, Math.ceil(found.total / ALERTS_PAGE));
  const at = (one: AlertKind | null, number = 1) => {
    const search = new URLSearchParams({ ...(one && { kind: one }), ...(number > 1 && { page: String(number) }) }).toString();
    return localePath(search ? `/alerts?${search}` : "/alerts", locale);
  };

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <h1>{m.pages["/alerts"].title}</h1>
      <p className="mt-2 max-w-[65ch] text-muted-foreground">{words.lede}</p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <nav aria-label={words.filter} className="flex flex-wrap gap-1">
          {[null, ...ALERT_KINDS].map((one) => (
            <Link
              key={one ?? "all"}
              href={at(one)}
              aria-current={one === kind ? "page" : undefined}
              className={buttonVariants({ variant: "ghost", className: "aria-[current]:bg-muted" })}
            >
              {words.kinds[one ?? "all"]}
            </Link>
          ))}
        </nav>
        {found.unread > 0 && (
          <form action={markAllAlertsReadAction} className="ml-auto">
            <Button type="submit" variant="outline">
              {words.markAllRead}
            </Button>
          </form>
        )}
      </div>
      {found.items.length ? (
        <ul aria-label={words.list} className="mt-6 flex flex-col gap-4">
          {found.items.map((alert) => (
            <li key={alert.id}>
              <AlertEntry id={alert.id} read={alert.read}>
                <AlertContent alert={alert} i18n={i18n} />
              </AlertEntry>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-muted-foreground">{kind ? words.emptyKind : words.empty}</p>
      )}
      {pages > 1 && (
        <nav aria-label={m.lots.pagination} className="mt-6 flex items-center gap-4">
          {page > 1 && (
            <Link href={at(kind, page - 1)} className={buttonVariants({ variant: "outline" })}>
              {m.lots.previous}
            </Link>
          )}
          {page < pages && (
            <Link href={at(kind, page + 1)} className={buttonVariants({ variant: "outline" })}>
              {m.lots.next}
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}

const HEADING = "font-heading text-base font-semibold group-data-unread:font-bold";

function AlertContent({ alert, i18n }: { alert: Alert; i18n: I18n }) {
  const { locale, m } = i18n;
  const words = m.alerts;
  const sent = (
    <p className="text-sm text-muted-foreground">
      <LocalTime value={alert.created_at} />
    </p>
  );
  if (alert.kind === "matches") {
    return (
      <>
        <h2 className={HEADING}>{plural(locale, words.matches, alert.payload.total)}</h2>
        {sent}
        {alert.payload.searches.map((search) => (
          <section key={search.id} aria-labelledby={`search-${alert.id}-${search.id}`} className="mt-4">
            <h3 id={`search-${alert.id}-${search.id}`} className="font-semibold">
              {fill(pluralForm(locale, words.search, search.total), { name: search.name, count: formatCount(locale, search.total) })}
            </h3>
            <ul className="mt-2 flex flex-col gap-2">
              {search.lots.map((lot) => {
                const others = lot.searches.filter((name) => name !== search.name);
                return (
                  <li key={keyOf(lot)}>
                    <LotLine lot={lot} i18n={i18n} />
                    {others.length > 0 && <p className="text-sm text-muted-foreground">{fill(words.alsoMatches, { names: others.join(", ") })}</p>}
                  </li>
                );
              })}
            </ul>
            {search.total > search.lots.length && (
              <Link href={localePath(listPath(readQuery(new URLSearchParams(search.query))), locale)} className="mt-2 inline-block text-sm">
                {fill(words.seeAll, { count: formatCount(locale, search.total) })}
              </Link>
            )}
          </section>
        ))}
      </>
    );
  }
  if (alert.kind === "changes") {
    const { lots } = alert.payload;
    return (
      <>
        <h2 className={HEADING}>
          {fill(pluralForm(locale, words.changes, lots.length), {
            what: changed(lots.map(({ changes }) => changes), i18n),
            count: formatCount(locale, lots.length),
          })}
        </h2>
        {sent}
        <ul className="mt-4 flex flex-col gap-3">
          {lots.map(({ lot, changes }) => (
            <li key={keyOf(lot)}>
              <LotLine lot={lot} i18n={i18n} />
              <Changes lot={lot} changes={changes} i18n={i18n} />
            </li>
          ))}
        </ul>
      </>
    );
  }
  const { lot, reminders, changes } = alert.payload;
  return (
    <>
      <h2 className={HEADING}>{words.reminder[reminders.includes("hour") ? "hour" : "day"]}</h2>
      {sent}
      <div className="mt-4">
        <LotLine lot={lot} i18n={i18n} />
        {lot.sale_at && <p className="text-sm">{rich(words.starts, { time: <LocalTime value={lot.sale_at} format="sale" /> })}</p>}
        <Changes lot={lot} changes={changes} i18n={i18n} />
      </div>
    </>
  );
}

/** A lot's name, linking to its page, then its number, auction, place and sale. */
function LotLine({ lot, i18n }: { lot: LotSummary; i18n: I18n }) {
  const { locale, m } = i18n;
  const number = fill(m.lot.number, { number: lot.lot_number });
  const title = [lot.year, lot.make, lot.model, lot.trim].filter(Boolean).join(" ") || number;
  const where = [number, auctionName(lot.source), place(lot) !== "—" && place(lot)].filter(Boolean).join(" · ");
  return (
    <>
      <Link href={localePath(lotPath(lot), locale)} className="font-medium">
        {title}
      </Link>
      <p className="text-sm text-muted-foreground">
        {where} · <Sale time={{ at: lot.sale_at, date: lot.sale_date }} i18n={i18n} />
      </p>
    </>
  );
}

/** An auction's time in the reader's zone, a day as the auction gives it, or a future sale. */
function Sale({ time, i18n: { locale, m } }: { time: SaleTime; i18n: I18n }) {
  if (time.at) return <LocalTime value={time.at} format="sale" />;
  return time.date ? saleDate(time.date, locale) : m.lot.futureSale;
}

/**
 * What changed on these lots, as the email's subject says it: "Auction date set and Buy now price
 * changed". A future sale given its date reads as set, not as changed.
 */
function changed(all: LotChanges[], { locale, m }: I18n) {
  const sales = all.flatMap(({ sale }) => (sale ? [sale] : []));
  const words = new Intl.ListFormat(LOCALES[locale].tag).format([
    ...(sales.length ? [sales.some(({ from }) => from.at || from.date) ? m.alerts.changed.sale : m.alerts.changed.saleSet] : []),
    ...(all.some(({ buy_now }) => buy_now) ? [m.alerts.changed.buyNow] : []),
  ]);
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** What changed on a lot, set apart on a grey ground, each new value in bold. */
function Changes({ lot, changes, i18n }: { lot: LotSummary; changes: LotChanges | null; i18n: I18n }) {
  const { locale, m } = i18n;
  const offer = (value: number | null) => (value ? amount(value, lot.currency, locale) : m.alerts.notOffered);
  if (!changes) return null;
  return (
    <ul className="mt-2 flex w-fit flex-col gap-1 rounded-lg bg-muted px-3 py-2 text-sm">
      {changes.sale && (
        <li>
          {rich(changes.sale.from.at || changes.sale.from.date ? m.alerts.sale : m.alerts.saleSet, {
            from: <Sale time={changes.sale.from} i18n={i18n} />,
            to: (
              <strong>
                <Sale time={changes.sale.to} i18n={i18n} />
              </strong>
            ),
          })}
        </li>
      )}
      {changes.buy_now && <li>{rich(m.alerts.buyNow, { from: offer(changes.buy_now.from), to: <strong>{offer(changes.buy_now.to)}</strong> })}</li>}
    </ul>
  );
}
