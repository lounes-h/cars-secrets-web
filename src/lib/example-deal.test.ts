import { describe, expect, it } from "vitest";
import { exampleAtCurrentBid, exampleAtMaxBid, exampleInputs } from "@/lib/example-deal";

describe("the home page example", () => {
  it("leaves room for profit at the current bid", () => {
    expect(exampleAtCurrentBid).toEqual({
      totalAcquisitionCost: 11_670,
      projectedProfit: 7_230,
      profitMargin: 7_230 / 18_900,
      suggestedMaxBid: 9_400,
    });
  });

  it("still hits the target profit at the suggested maximum bid", () => {
    expect(exampleAtMaxBid.totalAcquisitionCost).toBe(13_270);
    expect(exampleAtMaxBid.projectedProfit).toBe(exampleInputs.targetProfit);
    expect(exampleAtMaxBid.profitMargin).toBeCloseTo(0.298, 3);
  });

  it("never advertises a maximum bid below what the lot already stands at", () => {
    expect(exampleAtCurrentBid.suggestedMaxBid).toBeGreaterThan(exampleInputs.currentBid);
  });
});
