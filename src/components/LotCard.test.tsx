// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cardPhoto, LotCard } from "@/components/LotCard";
import type { Lot } from "@/lib/lots";
import { sampleLot } from "@/lib/lots-fixture";

afterEach(cleanup);

function show(lot: Partial<Lot> = {}) {
  return render(<LotCard lot={{ ...sampleLot, ...lot }} />).container;
}

const prices = () =>
  Object.fromEntries([...document.querySelectorAll("dl > div")].map((row) => [row.querySelector("dt")!.textContent, row.querySelector("dd")!.textContent]));

describe("lot card", () => {
  it("names the lot with a link to its page, and says where it is", () => {
    const card = show();
    const link = within(screen.getByRole("heading", { level: 2 })).getByRole("link", { name: "2013 ACURA TSX TECH" });
    expect(link.getAttribute("href")).toBe("/active-lots/copart/41633106");
    expect(card.textContent).toContain("Lot 41633106 · Copart · VALLEJO, CA");
  });

  it("shows the real money figures, and Buy now only when the auction offers it", () => {
    show();
    expect(prices()).toEqual({ "Current bid": "$0", "Likely final bid": "$3,175", "Retail value (ACV)": "$8,119" });
    cleanup();
    show({ buy_it_now_price: 6500, predicted_final_price: null, currency: "CAD" });
    expect(prices()).toEqual({ "Current bid": "CA$0", "Likely final bid": "—", "Retail value (ACV)": "CA$8,119", "Buy now": "CA$6,500" });
  });

  it("shows the mileage, the damage and the deal breakers", () => {
    const card = show({ offsite_address: "645 W UNION ST" });
    expect(card.textContent).toContain("120,500 mi · Primary damage: FRONT END");
    const badges = within(screen.getByRole("list", { name: "Deal breakers" })).getAllByRole("listitem");
    expect(badges.map((badge) => badge.textContent)).toContain("Offsite");
    expect(badges[0].textContent).toBe("Runs and drives");
  });

  it("leaves out the facts line when there is neither mileage nor damage", () => {
    const card = show({ odometer: null, damage_primary: null });
    expect(card.textContent).not.toContain(" mi");
    expect(card.textContent).not.toContain("Primary damage");
  });

  it("shows the sale in the reader's zone, a sale day as given, or a future sale", () => {
    let card = show();
    expect(card.querySelector("time")?.getAttribute("datetime")).toBe("2026-09-18T19:00:00Z");
    expect(card.textContent).toContain("Fri, Sep 18, 7:00 PM UTC");
    cleanup();
    card = show({ sale_at: null, sale_date: "2026-10-20" });
    expect(card.textContent).toContain("Oct 20, 2026");
    cleanup();
    card = show({ sale_at: null, sale_date: null });
    expect(card.textContent).toContain("Future sale");
  });

  it("falls back to the lot number for a lot with no year, make or model, and a dash for no place", () => {
    const card = show({ year: null, make: null, model: null, trim: null, location_city: null, location_state: null });
    expect(screen.getByRole("link", { name: "Lot 41633106" })).toBeTruthy();
    expect(card.textContent).toContain("Lot 41633106 · Copart");
    expect(card.textContent).not.toContain("—Primary");
  });

  it("shows the thumbnail's full-size twin, or says there is no photo", () => {
    const card = show({ thumbnail_url: "https://cs.copart.com/v1/a/b_thb.jpg" });
    expect(card.querySelector("img")?.getAttribute("src")).toBe("https://cs.copart.com/v1/a/b_ful.jpg");
    cleanup();
    expect(show({ thumbnail_url: null }).querySelector("img")).toBeNull();
    expect(screen.getByText("No photo")).toBeTruthy();
  });
});

describe("cardPhoto", () => {
  it("keeps a thumbnail that has no full-size name as it is, and refuses anything but https", () => {
    expect(cardPhoto({ ...sampleLot, thumbnail_url: " https://cs.copart.com/photo.jpg " })).toBe("https://cs.copart.com/photo.jpg");
    expect(cardPhoto({ ...sampleLot, thumbnail_url: "http://cs.copart.com/a_thb.jpg" })).toBeNull();
    expect(cardPhoto({ ...sampleLot, thumbnail_url: "javascript:alert(1)" })).toBeNull();
  });
});
