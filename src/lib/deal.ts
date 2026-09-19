/**
 * The arithmetic behind every vehicle analysis. Amounts are in whole dollars.
 *
 *   total acquisition cost = bid + auction fees + repairs + transport + other costs
 *   projected profit       = estimated resale value - total acquisition cost
 *   profit margin          = projected profit / estimated resale value
 *   suggested max bid      = resale value - fees - repairs - transport - other - target profit
 */

export type DealInputs = {
  estimatedResaleValue: number;
  currentBid: number;
  auctionFees: number;
  repairEstimate: number;
  transportEstimate: number;
  otherCosts?: number;
  targetProfit: number;
};

export type DealAnalysis = {
  totalAcquisitionCost: number;
  projectedProfit: number;
  /** Fraction of resale value, e.g. 0.18 for 18 %. */
  profitMargin: number;
  /** Never negative: 0 means there is no bid that reaches the target profit. */
  suggestedMaxBid: number;
};

export function analyzeDeal(inputs: DealInputs): DealAnalysis {
  const otherCosts = inputs.otherCosts ?? 0;
  for (const [key, value] of Object.entries({ ...inputs, otherCosts })) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`${key} must be a non-negative number, got ${value}`);
    }
  }

  const costsBesidesBid =
    inputs.auctionFees + inputs.repairEstimate + inputs.transportEstimate + otherCosts;
  const totalAcquisitionCost = inputs.currentBid + costsBesidesBid;
  const projectedProfit = inputs.estimatedResaleValue - totalAcquisitionCost;
  const profitMargin =
    inputs.estimatedResaleValue === 0 ? 0 : projectedProfit / inputs.estimatedResaleValue;
  const suggestedMaxBid = Math.max(
    0,
    inputs.estimatedResaleValue - costsBesidesBid - inputs.targetProfit,
  );

  return { totalAcquisitionCost, projectedProfit, profitMargin, suggestedMaxBid };
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUsd(amount: number): string {
  return usd.format(amount);
}

export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

/** A worked example, used by the default Open Graph image. */
export const exampleDeal: DealInputs = {
  estimatedResaleValue: 18500,
  currentBid: 9200,
  auctionFees: 850,
  repairEstimate: 2100,
  transportEstimate: 450,
  otherCosts: 300,
  targetProfit: 2500,
};
