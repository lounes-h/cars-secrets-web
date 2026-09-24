/**
 * Invented figures for the lot page's premium sections, the same on every lot, so the layout
 * can be built before the analysis exists. Every section that shows them says so (SAMPLE_NOTE).
 */
// ponytail: one sample lot for every lot. Replace section by section with the API's figures,
// and delete this file when the last one goes.

export const SAMPLE_NOTE = "Sample figures, the same on every lot, while this is being built.";

const market = {
  acv: 7076,
  cleanRetail: 9500,
  salvageResale: 7200,
  demand: "High",
  daysToSell: 24,
  similarSold90Days: 31,
};

export const SAMPLE = {
  summary: {
    text: "High-mileage GT hit front and rear. The engine starts but the car does not drive, so budget for a possible mechanical issue. The insurer's repair estimate is higher than the car's value, so it only makes sense as a DIY rebuild with used parts.",
    bestFor: "DIY rebuild or parts",
  },
  damage: {
    primary: "Rear end",
    secondary: "Front end",
    insurerEstimate: 9117,
    /** `spot` numbers the area on the damage map; `x`/`y` place it on the map's 400×200 drawing. */
    areas: [
      { spot: 1, x: 82, y: 146, area: "Front left", seen: "Bumper, headlight, fender", severity: "Severe", estimate: [1400, 2100], openEnded: false },
      { spot: 2, x: 322, y: 54, area: "Rear right", seen: "Bumper cover, quarter panel", severity: "Moderate", estimate: [900, 1400], openEnded: false },
      { spot: null, x: 0, y: 0, area: "Drivetrain", seen: "Starts, does not drive", severity: "Unknown", estimate: [500, 700], openEnded: true },
    ],
  },
  market,
  deal: {
    finalBid: [1600, 2200],
    similarSales: market.similarSold90Days,
    maxBid: 1900,
    fees: 550,
    shipping: 900,
    repair: 3200,
    resale: market.salvageResale,
    targetProfit: 1000,
  },
} as const;

export const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const plain = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** A cost range as the damage report writes it: "$1,400 – 2,100", "+" when it may run higher. */
export function range([low, high]: readonly [number, number], openEnded = false): string {
  return `${usd.format(low)} – ${plain.format(high)}${openEnded ? "+" : ""}`;
}
