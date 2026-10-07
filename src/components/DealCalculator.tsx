"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { analyzeDeal } from "@/lib/deal";
import { fill } from "@/lib/i18n";
import { SAMPLE, usd } from "@/lib/premium-sample";

const sample = SAMPLE.deal;

/** The deal calculator's body: a max bid to slide, and what the deal comes to at that bid. */
export function DealCalculator() {
  const { locale, m } = useI18n();
  const words = m.premium.deal;
  const money = (value: number) => usd(locale, value);
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
      <Label id="max-bid" className="mt-4">
        {fill(words.maxBid, { amount: money(maxBid) })}
      </Label>
      <Slider
        aria-labelledby="max-bid"
        min={0}
        max={sample.resale}
        step={50}
        value={[maxBid]}
        onValueChange={(value) => setMaxBid((value as readonly number[])[0])}
        className="mt-3"
      />
      <dl className="mt-3 grid grid-cols-[1fr_auto] [&>*]:border-t [&>*]:py-2 [&>dd]:text-right">
        <dt>{words.fees}</dt>
        <dd>{money(sample.fees)}</dd>
        <dt>{words.shipping}</dt>
        <dd>{money(sample.shipping)}</dd>
        <dt>{words.repair}</dt>
        <dd>{money(sample.repair)}</dd>
        <dt className="font-semibold">{words.totalCost}</dt>
        <dd className="font-semibold">{money(deal.totalAcquisitionCost)}</dd>
        <dt>{words.resale}</dt>
        <dd>{money(sample.resale)}</dd>
        <dt className="font-semibold">{words.profit}</dt>
        <dd className="font-semibold">
          {profit < 0 ? "−" : "+"}
          {money(Math.abs(profit))}
        </dd>
      </dl>
      <p className="mt-1 text-sm">{fill(words.maxBidFor, { target: money(sample.targetProfit), bid: money(deal.suggestedMaxBid) })}</p>
      <p className="mt-3 text-sm text-muted-foreground">{words.note}</p>
    </>
  );
}
