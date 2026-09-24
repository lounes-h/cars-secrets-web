"use client";

import { useState } from "react";
import { analyzeDeal } from "@/lib/deal";

// ponytail: invented figures, the same on every lot, so the layout can be built before the
// estimates exist. Replace with the lot's own inputs from the API, and drop the "Sample figures" line.
const SAMPLE = {
  finalBid: [1600, 2200],
  similarSales: 31,
  maxBid: 1900,
  fees: 550,
  shipping: 900,
  repair: 3200,
  resale: 7200,
  targetProfit: 1000,
} as const;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** The deal calculator's body: a max bid to slide, and what the deal comes to at that bid. */
export function DealCalculator() {
  const [maxBid, setMaxBid] = useState<number>(SAMPLE.maxBid);
  const deal = analyzeDeal({
    estimatedResaleValue: SAMPLE.resale,
    currentBid: maxBid,
    auctionFees: SAMPLE.fees,
    repairEstimate: SAMPLE.repair,
    transportEstimate: SAMPLE.shipping,
    targetProfit: SAMPLE.targetProfit,
  });
  const profit = deal.projectedProfit;

  return (
    <>
      <p className="mt-3 font-semibold">
        Likely final bid: {usd.format(SAMPLE.finalBid[0])} to {usd.format(SAMPLE.finalBid[1])}
      </p>
      <p className="hint">Based on {SAMPLE.similarSales} similar sales</p>
      <label htmlFor="max-bid" className="mt-4 block">
        Your max bid: {usd.format(maxBid)}
      </label>
      <input
        id="max-bid"
        type="range"
        min={0}
        max={SAMPLE.resale}
        step={50}
        value={maxBid}
        onChange={(event) => setMaxBid(Number(event.target.value))}
        className="mt-2 w-full accent-ink"
      />
      <dl className="mt-3 grid grid-cols-[1fr_auto] [&>*]:border-t [&>*]:border-line [&>*]:py-2 [&>dd]:text-right">
        <dt>Fees (calculated)</dt>
        <dd>{usd.format(SAMPLE.fees)}</dd>
        <dt>Shipping to you</dt>
        <dd>{usd.format(SAMPLE.shipping)}</dd>
        <dt>Repair (our estimate)</dt>
        <dd>{usd.format(SAMPLE.repair)}</dd>
        <dt className="font-semibold">Total cost</dt>
        <dd className="font-semibold">{usd.format(deal.totalAcquisitionCost)}</dd>
        <dt>Resale after repair</dt>
        <dd>{usd.format(SAMPLE.resale)}</dd>
        <dt className="font-semibold">Est. profit</dt>
        <dd className="font-semibold">
          {profit < 0 ? "−" : "+"}
          {usd.format(Math.abs(profit))}
        </dd>
      </dl>
      <p className="mt-1 text-sm">
        Max bid for {usd.format(SAMPLE.targetProfit)} profit: {usd.format(deal.suggestedMaxBid)}
      </p>
      <p className="hint mt-3">Sample figures, the same on every lot, while the calculator is being built.</p>
    </>
  );
}
