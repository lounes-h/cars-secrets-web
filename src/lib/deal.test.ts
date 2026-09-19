import { describe, expect, it } from "vitest";
import { analyzeDeal, type DealInputs } from "@/lib/deal";

const exampleDeal: DealInputs = {
  estimatedResaleValue: 18500,
  currentBid: 9200,
  auctionFees: 850,
  repairEstimate: 2100,
  transportEstimate: 450,
  otherCosts: 300,
  targetProfit: 2500,
};

describe("analyzeDeal", () => {
  it("computes cost, profit, margin and max bid for the worked example", () => {
    expect(analyzeDeal(exampleDeal)).toEqual({
      totalAcquisitionCost: 12900,
      projectedProfit: 5600,
      profitMargin: 5600 / 18500,
      suggestedMaxBid: 12300,
    });
  });

  it("treats missing other costs as zero", () => {
    expect(analyzeDeal({ ...exampleDeal, otherCosts: undefined }).suggestedMaxBid).toBe(12600);
  });

  it("reports a loss when the bid is already above the break-even point", () => {
    const result = analyzeDeal({ ...exampleDeal, currentBid: 16000 });
    expect(result.projectedProfit).toBe(-1200);
    expect(result.profitMargin).toBeLessThan(0);
  });

  it("never suggests a negative max bid", () => {
    const deal: DealInputs = { ...exampleDeal, estimatedResaleValue: 4000 };
    expect(analyzeDeal(deal).suggestedMaxBid).toBe(0);
  });

  it("returns a zero margin instead of dividing by zero", () => {
    const deal: DealInputs = {
      estimatedResaleValue: 0,
      currentBid: 0,
      auctionFees: 0,
      repairEstimate: 0,
      transportEstimate: 0,
      targetProfit: 0,
    };
    expect(analyzeDeal(deal).profitMargin).toBe(0);
  });

  it.each([
    ["negative", { repairEstimate: -1 }],
    ["NaN", { auctionFees: Number.NaN }],
    ["infinite", { currentBid: Number.POSITIVE_INFINITY }],
    ["negative other costs", { otherCosts: -5 }],
  ])("rejects %s inputs", (_label, override) => {
    expect(() => analyzeDeal({ ...exampleDeal, ...override })).toThrow(RangeError);
  });
});
