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

  it("sends the dealer to the auction to bid, and back to the listing", async () => {
    await show();
    const bid = screen.getByRole("link", { name: "Bid on copart" });
    expect(bid.getAttribute("href")).toBe(sampleLot.listing_url);
    expect(bid.getAttribute("rel")).toContain("noopener");
    expect(screen.getByRole("link", { name: "All lots" }).getAttribute("href")).toBe("/auctions");
  });

  it("shows every photo of the lot, full size, each linking to the file", async () => {
    await show();
    expect(getLotImages).toHaveBeenCalledWith("copart", "41633106", "token-abc", null);
    const photos = screen.getAllByRole("img");
    // The full-size photo when the auction publishes one, its thumbnail when it does not.
    expect(photos.map((photo) => photo.getAttribute("src"))).toEqual([
      "https://cs.copart.example/a_ful.jpg",
      "https://cs.copart.example/b_thb.jpg",
    ]);
    expect(photos[0].getAttribute("alt")).toBe("2013 ACURA TSX, lot 41633106, photo 1 of 2");
    expect(photos[0].getAttribute("loading")).toBeNull();
    expect(photos[1].getAttribute("loading")).toBe("lazy");
    const link = screen.getByRole("link", { name: /photo 1 of 2/ });
    expect(link.getAttribute("href")).toBe("https://cs.copart.example/a_ful.jpg");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("shows no photo section when the auction publishes none", async () => {
    getLotImages.mockResolvedValue([]);
    await show();
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
