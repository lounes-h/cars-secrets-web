// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
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

const { default: LotPage, generateMetadata } = await import("@/app/auctions/[source]/[lotNumber]/page");

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

  it("shows what the auction publishes about the lot", async () => {
    await show();
    expect(getLot).toHaveBeenCalledWith("copart", "41633106", "token-abc", null);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("2013 ACURA TSX");
    const page = screen.getByRole("main").textContent ?? "";
    expect(page).toContain("JH4CU2F65DC010051");
    expect(page).toContain("120,500 mi");
    expect(page).toContain("Sep 18, 2026, 7:00 PM");
    expect(page).toContain("$8,119");
    expect(page).toContain("$2,400");
  });

  it("shows every column the auction's export fills, and none of the ingest's bookkeeping", async () => {
    await show();
    const page = screen.getByRole("main").textContent ?? "";
    for (const value of [
      "AUTOMOBILE", "2.4L 4", "GAS", "AUTOMATIC", "FRONT", "PURE SALE", "INSURANCE CO",
      "CA - VALLEJO", "123", "94590", "USA", "SEDAN 4DR", "CHARCOAL", "SC",
      "NOT ACTUAL",             // odometer_brand, "N" in Copart's export
      "Sep 18, 2026",           // sale_date, as a day
      "Sep 17, 2026, 9:12 AM",  // source_created_at, which carries no time zone
      "Sep 18, 2026, 6:44 AM",  // source_updated_at
    ]) {
      expect(page, value).toContain(value);
    }
    expect(page).not.toContain(sampleLot.image_url);
    expect(page).not.toContain(sampleLot.thumbnail_url);
  });

  it("sends the dealer to the auction to bid, and back to the listing", async () => {
    await show();
    const bid = screen.getByRole("link", { name: "Bid on copart" });
    expect(bid.getAttribute("href")).toBe(sampleLot.listing_url);
    expect(bid.getAttribute("rel")).toContain("noopener");
    expect(screen.getByRole("link", { name: "Active lots" }).getAttribute("href")).toBe("/auctions");
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
    expect(metadata.alternates?.canonical).toBe("https://cars-secrets.test/auctions/copart/41633106");
  });
});
