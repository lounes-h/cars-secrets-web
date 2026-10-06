import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { LotBadges } from "@/components/LotBadges";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
 * the real money figures, the deal breakers and when it sells. The whole card opens the lot.
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
    <Card className="relative h-full pt-0 transition-shadow hover:ring-foreground/30 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- the auction hosts the photo; next/image would proxy it
        <img src={photo} alt="" loading="lazy" className="aspect-[4/3] w-full bg-muted object-cover" />
      ) : (
        <div className="grid aspect-[4/3] place-items-center bg-muted text-muted-foreground">No photo</div>
      )}
      <CardHeader>
        <h2 className="font-heading text-base leading-snug font-semibold">
          {/* Stretched over the card, so a click anywhere opens the lot; the heading is its name. */}
          <Link href={lotPath(lot)} className="no-underline outline-none after:absolute after:inset-0 hover:underline">
            {title}
          </Link>
        </h2>
        <p className="text-muted-foreground">{where.join(" · ")}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          {prices.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-semibold tabular-nums">{amount(value, lot.currency)}</dd>
            </div>
          ))}
        </dl>
        {facts.length > 0 && <p>{facts.join(" · ")}</p>}
        <LotBadges lot={lot} className="gap-1.5" />
        {/* No sale day yet is what Copart calls a future sale. */}
        <p className="mt-auto flex items-center gap-1.5 text-muted-foreground">
          <CalendarIcon aria-hidden="true" className="size-4 flex-none" />
          {lot.sale_at ? <LocalTime value={lot.sale_at} format="sale" /> : lot.sale_date ? saleDate(lot.sale_date) : "Future sale"}
        </p>
      </CardContent>
    </Card>
  );
}
