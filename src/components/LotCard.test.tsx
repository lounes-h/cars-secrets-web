// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cardPhoto, LotCard } from "@/components/LotCard";
import type { Lot } from "@/lib/lots";
import { sampleLot } from "@/lib/lots-fixture";
import { en } from "@/messages/en";
import { es } from "@/messages/es";

afterEach(cleanup);

function show(lot: Partial<Lot> = {}) {
  return render(<LotCard lot={{ ...sampleLot, ...lot }} i18n={{ locale: "en", m: en }} />).container;
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

  it("opens the lot from the photo, the title and View details only, not from the rest of the card", () => {
    const card = show();
    const links = [...card.querySelectorAll("a")];
    expect(links.map((link) => link.getAttribute("href"))).toEqual(Array(3).fill("/active-lots/copart/41633106"));
    expect(links[0].contains(card.querySelector("img"))).toBe(true);
    expect(links[1].textContent).toBe("2013 ACURA TSX TECH");
    expect(links[2].textContent).toBe("View details");
    // The title no longer covers the card, so the figures and badges sit outside every link.
    expect(links[1].className).not.toContain("after:absolute");
    expect(links.some((link) => link.contains(card.querySelector("dl")))).toBe(false);
    // The photo is a way in for a mouse, not another stop for a keyboard or a screen reader.
    expect(links[0].tabIndex).toBe(-1);
    expect(links[0].getAttribute("aria-hidden")).toBe("true");
  });

  it("opens the lot from the No photo box too when there is no photo", () => {
    const card = show({ thumbnail_url: null });
    expect(card.querySelector("a")!.textContent).toBe("No photo");
  });

  it("offers a View details button to the lot, left out of the tab order and of what a screen reader reads", () => {
    show();
    const details = screen.getByText("View details").closest("a")!;
    expect(details.getAttribute("href")).toBe("/active-lots/copart/41633106");
    expect(details.tabIndex).toBe(-1);
    expect(details.getAttribute("aria-hidden")).toBe("true");
    // The title stays the one link a keyboard or a screen reader finds.
    expect(screen.getAllByRole("link")).toHaveLength(1);
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

describe("lot card controls and availability", () => {
  it("makes room for the dealer's own controls, beside the money and above View details", () => {
    render(<LotCard lot={sampleLot} i18n={{ locale: "en", m: en }} actions={<button type="button">Save</button>} />);
    const save = screen.getByRole("button", { name: "Save" });
    const column = screen.getByText("Current bid").closest("dl")!.parentElement!;
    expect(column.contains(save)).toBe(true);
    expect(save.compareDocumentPosition(screen.getByText("View details")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("says a lot whose auction ended has most likely sold in a pure sale, and links only to the auction", () => {
    const card = render(<LotCard lot={sampleLot} i18n={{ locale: "en", m: en }} unavailable />).container;
    const [auction] = card.querySelectorAll("a");
    expect(card.querySelectorAll("a")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "View on Copart" })).toBe(auction);
    expect([auction.getAttribute("href"), auction.getAttribute("target")]).toEqual(["https://www.copart.com/lot/41633106", "_blank"]);
    expect(auction.getAttribute("rel")).toBe("noopener noreferrer nofollow");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("2013 ACURA TSX TECH");
    expect(card.textContent).toContain("Auction ended");
    expect(card.textContent).toContain("In a pure sale the highest bid wins, so this lot has most likely sold.");
    expect(card.textContent).not.toContain("View details");
    expect(card.querySelector("img")).toBeTruthy();
  });

  it("says a lot that may not have sold may be listed again, which the dealer will hear about", () => {
    const ended = (sale_status: string | null, locale: "en" | "es" = "en") =>
      render(<LotCard lot={{ ...sampleLot, sale_status }} i18n={{ locale, m: locale === "es" ? es : en }} unavailable />).container.textContent;
    expect(ended("On Minimum Bid")).toContain(
      "It sold only if bidding reached the seller's minimum. If not, Copart may list it again, and we'll alert you when it does.",
    );
    cleanup();
    expect(ended(" on approval ")).toContain(
      "It sold only if the seller accepted the highest bid. If not, Copart may list it again, and we'll alert you when it does.",
    );
    cleanup();
    expect(ended("On Approval", "es")).toContain("Solo se vendió si el vendedor aceptó la oferta más alta. Si no, Copart puede volver a publicarlo");
    cleanup();
    for (const status of [null, "", "NEW CODE"]) {
      expect(ended(status)).toContain("Its sale status is not stated, so whether it sold is unknown.");
      cleanup();
    }
  });

  it("leaves out the way to the auction when the lot has none", () => {
    const card = render(<LotCard lot={{ ...sampleLot, listing_url: null }} i18n={{ locale: "en", m: en }} unavailable />).container;
    expect(card.querySelectorAll("a")).toHaveLength(0);
  });
});

describe("cardPhoto", () => {
  it("keeps a thumbnail that has no full-size name as it is, and refuses anything but https", () => {
    expect(cardPhoto({ ...sampleLot, thumbnail_url: " https://cs.copart.com/photo.jpg " })).toBe("https://cs.copart.com/photo.jpg");
    expect(cardPhoto({ ...sampleLot, thumbnail_url: "http://cs.copart.com/a_thb.jpg" })).toBeNull();
    expect(cardPhoto({ ...sampleLot, thumbnail_url: "javascript:alert(1)" })).toBeNull();
  });
});

describe("lot card in Spanish", () => {
  it("words the card and links the lot under /es", () => {
    render(<LotCard lot={{ ...sampleLot, sale_at: null, sale_date: null }} i18n={{ locale: "es", m: es }} />);
    expect(screen.getAllByRole("link", { hidden: true }).every((link) => link.getAttribute("href")?.startsWith("/es/active-lots/"))).toBe(true);
    expect(screen.getByText(es.lot.currentBid)).toBeTruthy();
    expect(screen.getByText(es.lot.futureSale)).toBeTruthy();
    expect(screen.getByRole("list", { name: es.lot.dealBreakers }).textContent).toContain(es.signals.runsAndDrives);
  });
});
