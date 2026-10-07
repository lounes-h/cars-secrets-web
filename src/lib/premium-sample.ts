/**
 * Invented figures for the lot page's premium sections, the same on every lot, so the layout
 * can be built before the analysis exists. Every section that shows them says so
 * (`premium.sampleNote`). Their words are in the messages (`premium.sample`), area by area in
 * the same order.
 */
// ponytail: one sample lot for every lot. Replace section by section with the API's figures,
// and delete this file when the last one goes.

import { type Locale, LOCALES } from "@/lib/i18n";

const market = {
  acv: 7076,
  cleanRetail: 9500,
  salvageResale: 7200,
  daysToSell: 24,
  similarSold90Days: 31,
};

export const SAMPLE = {
  damage: {
    insurerEstimate: 9117,
    /** `spot` numbers the area on the damage map; `x`/`y` place it on the map's 400×200 drawing. */
    areas: [
      { spot: 1, x: 82, y: 146, estimate: [1400, 2100], openEnded: false },
      { spot: 2, x: 322, y: 54, estimate: [900, 1400], openEnded: false },
      { spot: null, x: 0, y: 0, estimate: [500, 700], openEnded: true },
    ],
  },
  market,
  deal: {
    maxBid: 1900,
    fees: 550,
    shipping: 900,
    repair: 3200,
    resale: market.salvageResale,
    targetProfit: 1000,
  },
} as const;

/** Whole dollars, as the language writes them: "$7,200". */
export const usd = (locale: Locale, value: number) =>
  new Intl.NumberFormat(LOCALES[locale].tag, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

/** A cost range as the damage report writes it: "$1,400 – 2,100", "+" when it may run higher. */
export function range(locale: Locale, [low, high]: readonly [number, number], openEnded = false): string {
  const plain = new Intl.NumberFormat(LOCALES[locale].tag, { maximumFractionDigits: 0 }).format(high);
  return `${usd(locale, low)} – ${plain}${openEnded ? "+" : ""}`;
}
