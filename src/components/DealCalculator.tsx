"use client";

import { useState } from "react";
import { analyzeDeal } from "@/lib/deal";
import { SAMPLE, usd } from "@/lib/premium-sample";

const sample = SAMPLE.deal;

/** The deal calculator's body: a max bid to slide, and what the deal comes to at that bid. */
export function DealCalculator() {
  const [maxBid, setMaxBid] = useState<number>(sample.maxBid);
  const deal = analyzeDeal({
    estimatedResaleValue: sample.resale,
    currentBid: maxBid,
    auctionFees: sample.fees,
    repairEstimate: sample.repair,
    transportEstimate: sample.shipping,
    targetProfit: sample.targetProfit,
  });
  const profit = deal.projectedProfit;

  return (
    <>
      <label htmlFor="max-bid" className="mt-4 block">
        Your max bid: {usd.format(maxBid)}
      </label>
      <input
        id="max-bid"
        type="range"
        min={0}
        max={sample.resale}
        step={50}
        value={maxBid}
        onChange={(event) => setMaxBid(Number(event.target.value))}
        className="mt-2 w-full accent-ink"
      />
      <dl className="mt-3 grid grid-cols-[1fr_auto] [&>*]:border-t [&>*]:border-line [&>*]:py-2 [&>dd]:text-right">
        <dt>Fees (calculated)</dt>
        <dd>{usd.format(sample.fees)}</dd>
        <dt>Shipping to you</dt>
        <dd>{usd.format(sample.shipping)}</dd>
        <dt>Repair (our estimate)</dt>
        <dd>{usd.format(sample.repair)}</dd>
        <dt className="font-semibold">Total cost</dt>
        <dd className="font-semibold">{usd.format(deal.totalAcquisitionCost)}</dd>
        <dt>Resale after repair</dt>
        <dd>{usd.format(sample.resale)}</dd>
        <dt className="font-semibold">Est. profit</dt>
        <dd className="font-semibold">
          {profit < 0 ? "−" : "+"}
          {usd.format(Math.abs(profit))}
        </dd>
      </dl>
      <p className="mt-1 text-sm">
        Max bid for {usd.format(sample.targetProfit)} profit: {usd.format(deal.suggestedMaxBid)}
      </p>
      <p className="hint mt-3">Calculator costs and profit use sample figures, the same on every lot, while this is being built.</p>
    </>
  );
}
