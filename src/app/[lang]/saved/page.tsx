import Link from "next/link";
import { LotCard } from "@/components/LotCard";
import { LotWatch } from "@/components/LotWatch";
import { SearchControls } from "@/components/SavedSearches";
import { SavedTabs } from "@/components/SavedTabs";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { type I18n, localePath } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { chips, listPath, readQuery } from "@/lib/lot-filters";
import { getSavedLots, getSavedSearches, keyOf, type SavedLot, type SavedSearch } from "@/lib/saved";
import { metadataForRoute } from "@/lib/seo/metadata";
import { currentUser, sessionToken, visitorIp } from "@/lib/session";

export const generateMetadata = () => metadataForRoute("/saved");

/**
 * What the dealer saved, in their account: lots, each with its reminders and change alerts (a lot
 * the auction no longer lists says so), and searches, each with its alerts.
 */
export default async function SavedPage() {
  const [i18n, user, token] = await Promise.all([getI18n(), currentUser(), sessionToken()]);
  const { locale, m } = i18n;
  if (!user || !token) {
    return (
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <h1>{m.pages["/saved"].title}</h1>
        <p className="mt-8">
          <Link href={localePath("/login", locale)} className={buttonVariants()}>
            {m.saved.signIn}
          </Link>
        </p>
      </main>
    );
  }
  const ip = await visitorIp();
  const [lots, searches] = await Promise.all([getSavedLots(token, ip), getSavedSearches(token, ip)]);
  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <h1>{m.pages["/saved"].title}</h1>
      <p className="mt-2 max-w-[65ch] text-muted-foreground">{m.saved.lede}</p>
      <SavedTabs
        counts={{ lots: lots.length, searches: searches.length }}
        lots={<SavedLots lots={lots} now={new Date().getTime()} i18n={i18n} />}
        searches={<SavedSearchList searches={searches} i18n={i18n} />}
      />
    </main>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">{children}</p>;
}

function SavedLots({ lots, now, i18n }: { lots: SavedLot[]; now: number; i18n: I18n }) {
  if (!lots.length) return <Empty>{i18n.m.saved.noLots}</Empty>;
  return (
    <ul className="flex flex-col gap-4">
      {lots.map(({ lot, available, change_alerts, remind_hour, remind_day }) => (
        <li key={keyOf(lot)}>
          <LotCard
            lot={lot}
            i18n={i18n}
            unavailable={!available}
            actions={
              <LotWatch
                lot={{ source: lot.source, lot_number: lot.lot_number, sale_at: lot.sale_at, buy_it_now_price: lot.buy_it_now_price }}
                initial={{ change_alerts, remind_hour, remind_day }}
                full={available}
                refresh
                now={now}
              />
            }
          />
        </li>
      ))}
    </ul>
  );
}

/** Each search: its name, opening its lots now, what it filters, and its controls. */
function SavedSearchList({ searches, i18n }: { searches: SavedSearch[]; i18n: I18n }) {
  const { locale, m } = i18n;
  if (!searches.length) return <Empty>{m.saved.noSearches}</Empty>;
  return (
    <ul className="flex flex-col gap-4">
      {searches.map((search) => {
        const query = readQuery(new URLSearchParams(search.query));
        const filters = chips(query, i18n).map((chip) => chip.label);
        return (
          <li key={search.id}>
            <Card className="gap-4 px-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle>
                  <Link href={localePath(listPath(query), locale)}>{search.name}</Link>
                </CardTitle>
                <p className="mt-1 text-muted-foreground">{filters.join(" · ") || m.searches.noFilters}</p>
              </div>
              <SearchControls search={search} />
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
