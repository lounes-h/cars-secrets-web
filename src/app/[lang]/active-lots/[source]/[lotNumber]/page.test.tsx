// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleLot } from "@/lib/lots-fixture";

const currentUser = vi.fn();
const getLot = vi.fn();
const getLotImages = vi.fn();
const getSavedLot = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/lib/session", () => ({
  currentUser,
  sessionToken: async () => "token-abc",
  visitorIp: async () => null,
}));
vi.mock("@/lib/lots", async (original) => ({ ...(await original<object>()), getLot, getLotImages }));
vi.mock("@/lib/saved", async (original) => ({ ...(await original<object>()), getSavedLot }));
vi.mock("@/app/[lang]/saved/actions", () => ({}));
vi.mock("next/navigation", () => ({ notFound, useRouter: () => ({ refresh: vi.fn() }) }));

const { default: LotPage, generateMetadata } = await import("@/app/[lang]/active-lots/[source]/[lotNumber]/page");

const params = Promise.resolve({ source: "copart", lotNumber: "41633106" });

async function show() {
  render(await LotPage({ params }));
}

beforeEach(() => {
  currentUser.mockResolvedValue({ id: "u1", email: "dealer@example.com" });
  getLot.mockResolvedValue(sampleLot);
  getLotImages.mockResolvedValue([
    { thumb: "https://cs.copart.example/a_thb.jpg", full: "https://cs.copart.example/a_ful.jpg" },
    { thumb: "https://cs.copart.example/b_thb.jpg", full: null },
  ]);
  getSavedLot.mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("lot page's Save and Remind me", () => {
  it("offers Save and Remind me beside the sale time, with nothing switched on yet", async () => {
    await show();
    expect(getSavedLot).toHaveBeenCalledWith({ source: "copart", lot_number: "41633106" }, "token-abc", null);
    const header = screen.getByRole("banner", { hidden: true });
    expect(within(header).getByRole("button", { name: "Save" }).getAttribute("aria-pressed")).toBe("false");
    expect(within(header).getByRole("button", { name: "Remind me" })).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("shows a saved lot's reminders and change alerts", async () => {
    getSavedLot.mockResolvedValue({ lot: sampleLot, available: true, saved_at: "2026-10-07T00:00:00Z", change_alerts: true, remind_hour: true, remind_day: false });
    await show();
    expect(screen.getByRole("button", { name: "Saved" })).toBeTruthy();
    expect(screen.getByText(/^Reminders: 1 hour before/)).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Email me when the auction date changes" }).getAttribute("aria-checked")).toBe("true");
  });

  it("still shows the lot when the API cannot say whether it is saved", async () => {
    getSavedLot.mockRejectedValue(new Error("down"));
    await show();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });
});

describe("lot page", () => {
  it("asks a visitor to sign in instead of fetching the lot", async () => {
    currentUser.mockResolvedValue(null);
    await show();
    expect(screen.getByRole("link", { name: "Sign in to see this lot" }).getAttribute("href")).toBe("/login");
    expect(getLot).not.toHaveBeenCalled();
    expect(screen.queryByText("Premium")).toBeNull();
  });

  it("puts the premium sections in their places, each saying its figures are samples", async () => {
    await show();
    for (const name of ["Summary", "Deal calculator", "Damage report", "Market"]) {
      const section = screen.getByRole("region", { name });
      expect(section.textContent).toMatch(/^Premium/);
      expect(section.textContent).toMatch(/sample figures, the same on every lot/i);
    }
    expect(within(screen.getByRole("banner", { hidden: true })).getByRole("region", { name: "Summary" })).toBeTruthy();
    const damageMap = screen.getAllByRole("tabpanel", { hidden: true })[1];
    expect(within(damageMap).getByRole("img", { hidden: true }).getAttribute("aria-label")).toBe("Damage map: 1 front left, 2 rear right");
    expect(damageMap.hidden).toBe(true); // the photos show first
    // Beside the existing sections, never in their place.
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "Summary",
      "Deal calculator",
      "Damage report",
      "Market",
      "Condition",
      "Paperwork",
      "Pickup",
      "Specs",
      "Sale info",
    ]);
  });

  it.each([
    [4250.5, "USD", "$4,251"],
    [0, "USD", "$0"],
    [3175, "CAD", "CA$3,175"],
    [null, "USD", "Not available"],
  ])("shows the API prediction %s in %s as %s", async (price, currency, display) => {
    getLot.mockResolvedValue({ ...sampleLot, predicted_final_price: price, currency });
    await show();
    const deal = within(screen.getByRole("region", { name: "Deal calculator" }));
    expect(deal.getByText(`Likely final bid: ${display}`)).toBeTruthy();
    expect(deal.queryByText(/Based on .* similar sales/)).toBeNull();
    expect(deal.queryByText(/\$1,600 to \$2,200/)).toBeNull();
  });

  it("opens with the car, the time left and the deal breakers", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-18T08:30:00Z"));
    await show();
    vi.useRealTimers();
    expect(getLot).toHaveBeenCalledWith("copart", "41633106", "token-abc", null);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("2013 ACURA TSX TECH");
    const header = screen.getByRole("banner", { hidden: true }).textContent ?? "";
    expect(header).toContain("Sells in 10h 30m");
    expect(header).toContain("Fri, Sep 18, 7:00 PM UTC"); // the reader's zone, UTC in tests
    expect(header).toContain("120,500 mi (mileage not real) · FWD · Primary damage: FRONT END · Secondary damage: SIDE · VALLEJO, CA");
    expect(header).not.toContain("Runs and drives, front end damage"); // no sentence repeating the badges
    const badges = within(screen.getByRole("list", { name: "Deal breakers" })).getAllByRole("listitem");
    expect(badges.map((badge) => [badge.textContent, badge.dataset.tone])).toEqual([
      ["Runs and drives", "good"],
      ["Keys", "good"],
      ["CA - Salvage Certificate", "warn"],
      ["Mileage not real", "bad"],
      ["Pure sale", "good"],
      ["Insurance seller", "good"],
    ]);
    // Never colour alone: every badge carries an icon as well as its words.
    expect(badges.every((badge) => badge.querySelector("svg[aria-hidden='true']"))).toBe(true);
    expect(screen.getByRole("button", { name: "Copy VIN" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy lot number" })).toBeTruthy();
  });

  it("says when the lot is offsite and where it is picked up", async () => {
    getLot.mockResolvedValue({ ...sampleLot, offsite_address: "645 W UNION ST", offsite_city: "ALLENTOWN", offsite_state: "PA", offsite_zip: "18101" });
    await show();
    const badges = within(screen.getByRole("list", { name: "Deal breakers" })).getAllByRole("listitem");
    expect([badges.at(-1)?.textContent, badges.at(-1)?.dataset.tone]).toEqual(["Offsite", "warn"]);
    const pickup = screen.getByRole("heading", { name: "Pickup" }).parentElement?.textContent ?? "";
    expect(pickup).toContain("Offsite address645 W UNION ST, ALLENTOWN, PA 18101");
  });

  it("says nothing about offsite for a lot at the yard", async () => {
    await show();
    expect(screen.getByRole("main").textContent).not.toMatch(/offsite/i);
  });

  it("says the secondary damage is N/A when the auction gives none", async () => {
    getLot.mockResolvedValue({ ...sampleLot, damage_secondary: null });
    await show();
    const header = screen.getByRole("banner", { hidden: true }).textContent ?? "";
    expect(header).toContain("120,500 mi (mileage not real) · FWD · Primary damage: FRONT END · Secondary damage: N/A · VALLEJO, CA");
  });

  it("leaves both damages out of the meta line when the auction gives no damage", async () => {
    getLot.mockResolvedValue({ ...sampleLot, damage_primary: null, damage_secondary: null });
    await show();
    const header = screen.getByRole("banner", { hidden: true }).textContent ?? "";
    expect(header).toContain("120,500 mi (mileage not real) · FWD · VALLEJO, CA");
    expect(header).not.toContain("damage:");
  });

  it("shows the sale day when the auction gives no sale time", async () => {
    getLot.mockResolvedValue({ ...sampleLot, sale_at: null });
    await show();
    expect(screen.getByRole("main").textContent).toContain("Sep 18, 2026");
    expect(screen.getByRole("main").textContent).not.toContain("Sells in");
  });

  it("calls a lot with no sale day yet a future sale", async () => {
    getLot.mockResolvedValue({ ...sampleLot, sale_at: null, sale_date: null });
    await show();
    const header = screen.getByRole("banner", { hidden: true }).textContent ?? "";
    expect(header).toContain("Future sale");
    expect(header).not.toContain("—");
  });

  it("leaves the drive out of the meta line when the auction does not know it", async () => {
    getLot.mockResolvedValue({ ...sampleLot, drive: "UNKNOWN" });
    await show();
    const header = screen.getByRole("banner", { hidden: true }).textContent ?? "";
    expect(header).toContain("120,500 mi (mileage not real) · Primary damage: FRONT END");
  });

  it("keeps every column the auction's export fills, in plain words, and none of the ingest's bookkeeping", async () => {
    await show();
    const page = screen.getByRole("main").textContent ?? "";
    for (const value of [
      "JH4CU2F65DC010051", "$8,119", "$2,400", "$0", "SIDE", "CA",
      "Automobile", // vehicle_type, "V" in Copart's export
      "2.4L 4-cyl", "GAS", "AUTOMATIC", "FWD", "Pure sale", "State Farm Insurance",
      "CA - VALLEJO, yard 123", "VALLEJO, CA 94590 USA", "SEDAN 4DR", "CHARCOAL", "USD",
      "CA - Salvage Certificate", // title_state and title_type, "CA" and "SC" in Copart's export
      "Mileage not real",       // odometer_brand, "N" in Copart's export
      "Updated on CopartSep 18, 2026, 6:44 AM UTC",   // source_updated_at
      "Added to this siteSep 18, 2026, 1:31 AM UTC",  // first_seen_at
      "Last change seenSep 18, 2026, 12:01 PM UTC",   // last_changed_at
    ]) {
      expect(page, value).toContain(value);
    }
    expect(page).not.toContain("Sep 17, 2026"); // source_created_at: the export's stamp, not when the lot was listed
    expect(page).not.toContain("NOT ACTUAL");
    expect(page).not.toContain("Sale status"); // a badge in the header, not a row in sale info
    expect(screen.getByRole("region", { name: "Specs" }).textContent).not.toContain("Drive"); // "FWD" in the header, not a spec tile
    expect(page).not.toContain("Title state"); // the state is part of the title, as on copart.com
    expect(page).not.toContain(sampleLot.image_url);
    expect(page).not.toContain(sampleLot.thumbnail_url);
  });

  it("gives specs and sale info their own sections, never collapsed", async () => {
    await show();
    for (const name of ["Specs", "Sale info", "Condition", "Paperwork", "Pickup", "Deal calculator"]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeTruthy();
    }
    expect(document.querySelector("details")).toBeNull();
  });

  it("replaces the all-in cost with the deal calculator, keeping the lot's own bid and value", async () => {
    await show();
    expect(screen.queryByRole("region", { name: "All-in cost" })).toBeNull();
    const deal = screen.getByRole("region", { name: "Deal calculator" }).textContent ?? "";
    expect(deal).toMatch(/sample figures, the same on every lot/i);
    expect(deal).toContain("Current bid $0 · Retail value (ACV) $8,119");
  });

  it("sends the dealer to the auction from the top of the page, and only from there", async () => {
    await show();
    const header = screen.getByRole("banner", { hidden: true });
    const auction = within(header).getByRole("link", { name: "View on Copart" });
    expect(auction.getAttribute("href")).toBe(sampleLot.listing_url);
    expect(auction.getAttribute("target")).toBe("_blank");
    expect(auction.getAttribute("rel")).toContain("noopener");
    expect(within(header).getByText("Bidding happens on Copart's own site.")).toBeTruthy();
    const cost = screen.getByRole("region", { name: "Deal calculator" });
    expect(within(cost).queryAllByRole("link")).toEqual([]); // no "Place bid", and no buy now unless offered
    expect(screen.queryByRole("link", { name: "Place bid" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Active lots" })).toBeNull();
  });

  it("has no auction link when the lot has no listing", async () => {
    getLot.mockResolvedValue({ ...sampleLot, listing_url: null });
    await show();
    expect(screen.queryByRole("link", { name: /View on/ })).toBeNull();
  });

  it("offers buy now when the auction does", async () => {
    getLot.mockResolvedValue({ ...sampleLot, buy_it_now_price: 5200 });
    await show();
    expect(screen.getByRole("link", { name: "Buy now $5,200" }).getAttribute("href")).toBe(sampleLot.listing_url);
  });

  it("shows every photo of the lot as a gallery, thumbnails jumping to each", async () => {
    await show();
    expect(getLotImages).toHaveBeenCalledWith("copart", "41633106", "token-abc", null);
    // The large photos: the full-size file when the auction publishes one, its thumbnail when not.
    const photos = screen.getAllByAltText(/photo \d of 2$/);
    expect(photos.map((photo) => photo.getAttribute("src"))).toEqual([
      "https://cs.copart.example/a_ful.jpg",
      "https://cs.copart.example/b_thb.jpg",
    ]);
    expect(photos[0].getAttribute("alt")).toBe("2013 ACURA TSX, lot 41633106, photo 1 of 2");
    expect(photos[0].getAttribute("loading")).toBeNull();
    expect(photos[1].getAttribute("loading")).toBe("lazy");
    // The strip below: a thumbnail per photo, each one jumping to it.
    const jumps = screen.getAllByRole("link", { name: /Show photo/ });
    expect(jumps.map((jump) => jump.getAttribute("href"))).toEqual(["#photo-1", "#photo-2"]);
    expect(photos.map((photo) => photo.getAttribute("id"))).toEqual(["photo-1", "photo-2"]);
    expect(screen.getByAltText("Show photo 1").getAttribute("src")).toBe("https://cs.copart.example/a_thb.jpg");
  });

  it("leaves out the thumbnail strip when there is one photo to see", async () => {
    getLotImages.mockResolvedValue([{ thumb: null, full: "https://cs.copart.example/only_ful.jpg" }]);
    await show();
    expect(screen.queryAllByRole("link", { name: /Show photo/ })).toEqual([]);
    expect(screen.getByAltText(/photo 1 of 1$/).getAttribute("src")).toBe("https://cs.copart.example/only_ful.jpg");
  });

  it("shows no gallery when the auction publishes no photo", async () => {
    getLotImages.mockResolvedValue([]);
    await show();
    expect(screen.queryByRole("region", { name: /Photos of lot/ })).toBeNull();
    expect(screen.queryAllByRole("img")).toEqual([]);
    expect(screen.getByText("The auction has published no photos of this lot.")).toBeTruthy();
  });

  it("is a not found page once the auction drops the lot", async () => {
    getLot.mockResolvedValue(null);
    await expect(show()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("keeps the lot out of search indexes", async () => {
    const metadata = await generateMetadata({ params });
    expect(metadata.title).toEqual({ absolute: "Lot 41633106" });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe("https://cars-secrets.test/active-lots/copart/41633106");
  });
});

describe("lot page with little data", () => {
  it("shows dashes where the auction gave nothing, and any photo size it has", async () => {
    getLot.mockResolvedValue({
      ...sampleLot, year: null, make: null, model: null, trim: null, currency: null, color: null,
    });
    getLotImages.mockResolvedValue([
      { thumb: null, full: "https://cs.copart.example/a_ful.jpg" },
      { thumb: null, full: null },
      { thumb: "https://cs.copart.example/c_thb.jpg", full: null },
    ]);
    await show();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("—");
    // A photo with no file at all is left out; the strip uses the full size when there is no thumbnail.
    expect(screen.getByAltText("Show photo 1").getAttribute("src")).toBe("https://cs.copart.example/a_ful.jpg");
    expect(screen.getAllByAltText(/photo \d of 2$/)).toHaveLength(2);
    const sale = screen.getByRole("region", { name: "Sale info" });
    expect(within(sale).getByText("Currency").nextElementSibling?.textContent).toBe("—");
  });
});
