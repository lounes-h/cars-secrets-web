import { analyzeDeal, type DealInputs } from "@/lib/deal";

/**
 * The single lot shown on the home page. It is an illustration, not a real
 * listing: the inputs are round numbers, and every figure derived from them is
 * computed by analyzeDeal, so the example can never drift from the arithmetic
 * the product actually uses.
 */
export const exampleLot = {
  name: "2022 Toyota Camry SE",
  source: "Copart",
  location: "Raleigh, NC",
  odometer: "48,200 miles",
  damage: "Front end damage",
  titleStatus: "Salvage title",
  sale: "Tomorrow, 10:00 AM",
  badges: ["Run & drive", "Keys available"],
} as const;

export const exampleInputs: DealInputs = {
  estimatedResaleValue: 18_900,
  currentBid: 7_800,
  auctionFees: 1_350,
  repairEstimate: 2_100,
  transportEstimate: 420,
  targetProfit: 5_630,
};

/** The lot at the bid it currently stands at. */
export const exampleAtCurrentBid = analyzeDeal(exampleInputs);

/** The same lot if the dealer paid the suggested maximum bid. */
export const exampleAtMaxBid = analyzeDeal({
  ...exampleInputs,
  currentBid: exampleAtCurrentBid.suggestedMaxBid,
});
