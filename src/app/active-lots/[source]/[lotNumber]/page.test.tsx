// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleLot } from "@/lib/lots-fixture";

const currentUser = vi.fn();
const getLot = vi.fn();
const getLotImages = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/lib/session", () => ({
  currentUser,
  sessionToken: async () => "token-abc",
  visitorIp: async () => null,
}));
vi.mock("@/lib/lots", async (original) => ({ ...(await original<object>()), getLot, getLotImages }));
vi.mock("next/navigation", () => ({ notFound }));

const { default: LotPage, generateMetadata } = await import("@/app/active-lots/[source]/[lotNumber]/page");

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
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("lot page", () => {
  it("asks a visitor to sign in instead of fetching the lot", async () => {
    currentUser.mockResolvedValue(null);
    await show();
    expect(screen.getByRole("link", { name: "Sign in to see this lot" }).getAttribute("href")).toBe("/login");
    expect(getLot).not.toHaveBeenCalled();
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
    expect(header).toContain("Fri, Sep 18, 7:00 PM");
    expect(header).toContain("120,500 mi (mileage not real) · FRONT END · VALLEJO, CA");
    expect(header).toContain("Runs and drives, front end damage, mileage not real, salvage certificate.");
    const badges = within(screen.getByRole("list", { name: "Deal breakers" })).getAllByRole("listitem");
    expect(badges.map((badge) => [badge.textContent, badge.dataset.tone])).toEqual([
      ["✓Runs and drives", "good"],
      ["✓Keys", "good"],
      ["!Salvage certificate", "warn"],
      ["✕Mileage not real", "bad"],
    ]);
    expect(screen.getByRole("button", { name: "Copy VIN" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy lot number" })).toBeTruthy();
  });

  it("shows the sale day when the auction gives no sale time", async () => {
    getLot.mockResolvedValue({ ...sampleLot, sale_at: null });
    await show();
    expect(screen.getByRole("main").textContent).toContain("Sep 18, 2026");
    expect(screen.getByRole("main").textContent).not.toContain("Sells in");
  });

  it("keeps every column the auction's export fills, in plain words, and none of the ingest's bookkeeping", async () => {
    await show();
    const page = screen.getByRole("main").textContent ?? "";
    for (const value of [
      "JH4CU2F65DC010051", "$8,119", "$2,400", "$0", "SIDE", "CA",
      "AUTOMOBILE", "2.4L 4-cyl", "GAS", "AUTOMATIC", "FRONT", "Pure sale", "INSURANCE CO",
      "CA - VALLEJO, yard 123", "VALLEJO, CA 94590 USA", "SEDAN 4DR", "CHARCOAL", "USD",
      "Salvage certificate",    // title_type, "SC" in Copart's export
      "Mileage not real",       // odometer_brand, "N" in Copart's export
      "Sep 17, 2026, 9:12 AM",  // source_created_at, which carries no time zone
      "Sep 18, 2026, 6:44 AM",  // source_updated_at
      "Sep 18, 2026, 1:31 AM",  // first_seen_at
      "Sep 18, 2026, 12:01 PM", // last_changed_at
    ]) {
      expect(page, value).toContain(value);
    }
    expect(page).not.toContain("NOT ACTUAL");
    expect(page).not.toContain(sampleLot.image_url);
    expect(page).not.toContain(sampleLot.thumbnail_url);
  });

  it("gives specs and sale info their own sections, never collapsed", async () => {
    await show();
    for (const name of ["Specs", "Sale info", "Condition", "Paperwork", "Pickup", "All-in cost"]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeTruthy();
    }
    expect(document.querySelector("details")).toBeNull();
  });

  it("adds up only what it knows, and says what is not estimated", async () => {
    await show();
    const cost = screen.getByRole("region", { name: "All-in cost" }).textContent ?? "";
    expect(cost).toContain("Current bid$0");
    expect(cost).toContain("Buyer and gate fees (est.)Not estimated yet");
    expect(cost).toContain("Shipping to you (est.)Not estimated yet");
    expect(cost).toContain("Retail value (ACV) $8,119");
  });

  it("sends the dealer to the auction to bid, and back to the listing", async () => {
    await show();
    const bid = screen.getByRole("link", { name: "Place bid" });
    expect(bid.getAttribute("href")).toBe(sampleLot.listing_url);
    expect(bid.getAttribute("rel")).toContain("noopener");
    expect(screen.queryByRole("link", { name: /Buy now/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Active lots" }).getAttribute("href")).toBe("/active-lots");
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
