import { CalendarIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { LotBadges } from "@/components/LotBadges";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { amount, auctionName, type Lot, lotPath, odometer, place, saleDate } from "@/lib/lots";

/**
 * The export's thumbnail is 144px wide, too small for a card, so the card shows its full-size
 * twin (`_thb` → `_ful`, as the API does when the auction's photo list fails). Only https.
 */
export function cardPhoto(lot: Lot): string | null {
  const url = lot.thumbnail_url?.trim();
  return url?.startsWith("https://") ? url.replace(/_thb\.(\w+)$/, "_ful.$1") : null;
}

/**
 * One lot in the list, answering "is this lot worth opening?": the photo, what it is and where,
 * the deal breakers, when it sells and the real money figures. The whole card opens the lot.
 */
export function LotCard({ lot }: { lot: Lot }) {
  const photo = cardPhoto(lot);
  const title = [lot.year, lot.make, lot.model, lot.trim].filter(Boolean).join(" ") || `Lot ${lot.lot_number}`;
  const where = [`Lot ${lot.lot_number}`, auctionName(lot.source), place(lot) !== "—" && place(lot)].filter(Boolean);
  const facts = [lot.odometer != null && odometer(lot.odometer), lot.damage_primary && `Primary damage: ${lot.damage_primary}`].filter(Boolean);
  const prices: [string, number | null][] = [
    ["Current bid", lot.high_bid],
    ["Likely final bid", lot.predicted_final_price],
    ["Retail value (ACV)", lot.est_retail_value],
  ];
  if (lot.buy_it_now_price) prices.push(["Buy now", lot.buy_it_now_price]);

  return (
    // One per line: the photo on the left, the lot in the middle, the money on the right; stacked on a phone.
    <Card className="relative gap-0 py-0 transition-shadow hover:ring-foreground/30 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring sm:flex-row">
      {/* At least 4:3 beside the text, and as tall as the card when the text runs longer. */}
      <div className="relative flex-none bg-muted sm:min-h-48 sm:w-64">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- the auction hosts the photo; next/image would proxy it
          <img src={photo} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover sm:absolute sm:inset-0 sm:aspect-auto sm:h-full" />
        ) : (
          <div className="grid aspect-[4/3] place-items-center text-muted-foreground sm:absolute sm:inset-0 sm:aspect-auto">No photo</div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:flex-row md:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="font-heading text-base leading-snug font-semibold">
            {/* Stretched over the card, so a click anywhere opens the lot; the heading is its name. */}
            <Link href={lotPath(lot)} className="no-underline outline-none after:absolute after:inset-0 hover:underline">
              {title}
            </Link>
          </h2>
          <p className="text-muted-foreground">{where.join(" · ")}</p>
          {facts.length > 0 && <p>{facts.join(" · ")}</p>}
          <LotBadges lot={lot} className="gap-1.5" />
          {/* No sale day yet is what Copart calls a future sale. */}
          <p className="mt-auto flex items-center gap-1.5 pt-1 text-muted-foreground">
            <CalendarIcon aria-hidden="true" className="size-4 flex-none" />
            {lot.sale_at ? <LocalTime value={lot.sale_at} format="sale" /> : lot.sale_date ? saleDate(lot.sale_date) : "Future sale"}
          </p>
        </div>
        <div className="flex flex-none flex-col gap-4 md:w-48 md:border-l md:pl-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-1">
            {prices.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-semibold tabular-nums">{amount(value, lot.currency)}</dd>
              </div>
            ))}
          </dl>
          {/* What the whole card does, said out loud. The title is the link a keyboard or a screen
              reader uses, so this one is left out of both rather than read twice. */}
          <Link href={lotPath(lot)} tabIndex={-1} aria-hidden="true" className={buttonVariants({ variant: "outline", className: "mt-auto" })}>
            View details
            <ChevronRightIcon aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
