import { CalendarIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LocalTime } from "@/components/LocalTime";
import { LotBadges } from "@/components/LotBadges";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fill, type I18n, localePath, lookup } from "@/lib/i18n";
import { SIGNALS } from "@/lib/lot-words";
import { amount, auctionName, type Lot, lotPath, odometer, place, saleDate } from "@/lib/lots";
import type { Messages } from "@/messages/en";

/**
 * The export's thumbnail is 144px wide, too small for a card, so the card shows its full-size
 * twin (`_thb` → `_ful`, as the API does when the auction's photo list fails). Only https.
 */
export function cardPhoto(lot: Lot): string | null {
  const url = lot.thumbnail_url?.trim();
  return url?.startsWith("https://") ? url.replace(/_thb\.(\w+)$/, "_ful.$1") : null;
}

const PHOTO_BOX = "relative flex-none bg-muted no-underline sm:min-h-48 sm:w-64";

/**
 * What an ended auction means, by its sale status: a pure sale has most likely sold; a minimum bid
 * or the seller's approval may not have, and the lot may be listed again, which the API alerts the
 * dealer to. Any other status says nothing either way.
 */
function endedNote(lot: Lot, m: Messages) {
  const word = lookup(SIGNALS.sale, (lot.sale_status ?? "").trim().toUpperCase())?.word;
  const note = (word && lookup(m.saved.endedNote, word)) || m.saved.endedNote.saleNotStated;
  return fill(note, { auction: auctionName(lot.source) });
}

/**
 * One lot in the list, answering "is this lot worth opening?": the photo, what it is and where,
 * the deal breakers, when it sells and the real money figures. The photo, the title and View
 * details open the lot; the rest of the card is text to read and select. `actions` are the
 * dealer's controls (Save). A lot the auction no longer lists (`unavailable`, on the Saved page)
 * has had its auction: it says what that means and has no page here to open, only the auction's.
 */
export function LotCard({ lot, i18n, actions, unavailable = false }: { lot: Lot; i18n: I18n; actions?: ReactNode; unavailable?: boolean }) {
  const { locale, m } = i18n;
  const href = localePath(lotPath(lot), locale);
  const photo = cardPhoto(lot);
  const number = fill(m.lot.number, { number: lot.lot_number });
  const title = [lot.year, lot.make, lot.model, lot.trim].filter(Boolean).join(" ") || number;
  const auction = auctionName(lot.source);
  const where = [number, auction, place(lot) !== "—" && place(lot)].filter(Boolean);
  const facts = [
    lot.odometer != null && odometer(lot.odometer, i18n),
    lot.damage_primary && fill(m.lot.primaryDamage, { damage: lot.damage_primary }),
  ].filter(Boolean);
  const prices: [string, number | null][] = [
    [m.lot.currentBid, lot.high_bid],
    [m.lot.likelyFinalBid, lot.predicted_final_price],
    [m.lot.retailValue, lot.est_retail_value],
  ];
  if (lot.buy_it_now_price) prices.push([m.lot.buyNow, lot.buy_it_now_price]);
  const picture = photo ? (
    // eslint-disable-next-line @next/next/no-img-element -- the auction hosts the photo; next/image would proxy it
    <img src={photo} alt="" loading="lazy" className="aspect-4/3 w-full object-cover sm:absolute sm:inset-0 sm:aspect-auto sm:h-full" />
  ) : (
    <div className="grid aspect-4/3 place-items-center text-muted-foreground sm:absolute sm:inset-0 sm:aspect-auto">{m.lot.noPhoto}</div>
  );

  return (
    // One per line: the photo on the left, the lot in the middle, the money on the right; stacked on a phone.
    <Card className="gap-0 py-0 sm:flex-row">
      {/* At least 4:3 beside the text, and as tall as the card when the text runs longer. One of the
          three ways into the lot, with the title and View details; the title is the one a keyboard
          or a screen reader uses, so this one is left out of both rather than read twice. */}
      {unavailable ? (
        <div className={PHOTO_BOX}>{picture}</div>
      ) : (
        <Link href={href} tabIndex={-1} aria-hidden="true" className={PHOTO_BOX}>
          {picture}
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6 md:flex-row md:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="font-heading text-base leading-snug font-semibold">
            {unavailable ? (
              title
            ) : (
              <Link href={href} className="no-underline hover:underline">
                {title}
              </Link>
            )}
          </h2>
          {unavailable && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{m.saved.ended}</Badge>
              {endedNote(lot, m)}
            </p>
          )}
          <p className="text-muted-foreground">{where.join(" · ")}</p>
          {facts.length > 0 && <p>{facts.join(" · ")}</p>}
          <LotBadges lot={lot} m={m} className="gap-1.5" />
          {/* No sale day yet is what Copart calls a future sale. */}
          <p className="mt-auto flex items-center gap-1.5 pt-1 text-muted-foreground">
            <CalendarIcon aria-hidden="true" className="size-4 flex-none" />
            {lot.sale_at ? <LocalTime value={lot.sale_at} format="sale" /> : lot.sale_date ? saleDate(lot.sale_date, locale) : m.lot.futureSale}
          </p>
        </div>
        <div className="flex flex-none flex-col gap-4 md:w-48 md:border-l md:pl-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-1">
            {prices.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-semibold tabular-nums">{amount(value, lot.currency, locale)}</dd>
              </div>
            ))}
          </dl>
          {actions}
          {unavailable ? (
            // The way left to the lot, so a real link: the title is no longer one.
            lot.listing_url && (
              <a
                href={lot.listing_url}
                rel="noopener noreferrer nofollow"
                target="_blank"
                className={buttonVariants({ variant: "outline", className: "mt-auto" })}
              >
                {fill(m.lotPage.viewOn, { auction })}
              </a>
            )
          ) : (
            // Left out of the tab order and of what a screen reader reads, like the photo.
            <Link href={href} tabIndex={-1} aria-hidden="true" className={buttonVariants({ variant: "outline", className: "mt-auto" })}>
              {m.lot.viewDetails}
              <ChevronRightIcon aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
