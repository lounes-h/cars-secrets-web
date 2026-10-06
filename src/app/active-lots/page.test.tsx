// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Lot } from "@/lib/lots";
import { sampleLot } from "@/lib/lots-fixture";

const currentUser = vi.fn();
const listLots = vi.fn();
const interpretSearch = vi.fn();
const getLotPreferences = vi.fn();
const getLotActivity = vi.fn();
const filterProps = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`);
});

vi.mock("@/lib/session", () => ({
  currentUser,
  sessionToken: async () => "token-abc",
  visitorIp: async () => null,
  visitorZone: async () => "America/New_York",
}));
vi.mock("@/lib/lots", async (original) => ({
  ...(await original<object>()),
  listLots,
  interpretSearch,
  getLotPreferences,
  getLotActivity,
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("@/components/LotFilters", () => ({
  LotFilters: ({ children, ...props }: { children: ReactNode }) => {
    filterProps(props);
    return <div>{children}</div>;
  },
}));

const { default: AuctionsPage } = await import("@/app/active-lots/page");
const { PAGE_SIZE } = await import("@/lib/lots");

const LOT: Lot = sampleLot;

const cards = () => [...screen.getByRole("list", { name: "Lots" }).children] as HTMLElement[];

function lots(n: number): Lot[] {
  return Array.from({ length: n }, (_, i) => ({ ...LOT, lot_number: `4163310${i}` }));
}

async function show(page?: string | Record<string, string | string[]>) {
  const params = typeof page === "object" ? page : page ? { page } : {};
  render(await AuctionsPage({ searchParams: Promise.resolve(params) }));
}

beforeEach(() => {
  currentUser.mockResolvedValue({ id: "u1", email: "dealer@example.com" });
  listLots.mockResolvedValue({ items: lots(PAGE_SIZE), total: 145 });
  getLotPreferences.mockResolvedValue({ filters: "", usage: {} });
  getLotActivity.mockResolvedValue({
    added: { today: 87, last_3_days: 11821, last_7_days: 57043 },
    updated: { today: 14769, last_3_days: 62275, last_7_days: 61280 },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("active lots page", () => {
  it("opens on the search, with its heading for screen readers only and no lede", async () => {
    const { container } = render(await AuctionsPage({ searchParams: Promise.resolve({}) }));
    const heading = screen.getByRole("heading", { level: 1, name: "Active lots" });
    expect(heading.className).toBe("sr-only");
    expect(container.querySelector("main > p")).toBeNull();
    expect(screen.queryByText(/Every active lot/)).toBeNull();
  });

  it("asks a visitor to sign in instead of listing lots", async () => {
    currentUser.mockResolvedValue(null);
    await show();
    expect(screen.getByRole("link", { name: "Sign in to see the lots" }).getAttribute("href")).toBe("/login");
    expect(listLots).not.toHaveBeenCalled();
    expect(getLotActivity).not.toHaveBeenCalled();
    expect(screen.queryByRole("list", { name: "Lots" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Lot activity" })).toBeNull();
  });

  it("sums up the lots added and updated lately in a strip above the page, in the dealer's zone", async () => {
    const { container } = render(await AuctionsPage({ searchParams: Promise.resolve({}) }));
    expect(getLotActivity).toHaveBeenCalledWith("token-abc", null, "America/New_York");
    const strip = screen.getByRole("region", { name: "Lot activity" });
    expect(container.firstElementChild).toBe(strip);
    expect([...strip.querySelectorAll("p")].map((p) => p.textContent)).toEqual([
      "11,821 new lots in the last 3 days",
      "14,769 lots updated today",
    ]);
  });

  it("says today's new lots are a count so far", async () => {
    getLotActivity.mockResolvedValue({
      added: { today: 2632, last_3_days: 11821, last_7_days: 57043 },
      updated: { today: 34023, last_3_days: 62275, last_7_days: 61280 },
    });
    await show();
    expect([...screen.getByRole("region", { name: "Lot activity" }).querySelectorAll("p")].map((p) => p.textContent)).toEqual([
      "2,632 new lots today so far",
      "34,023 lots updated today",
    ]);
  });

  it("says lot for a single one", async () => {
    getLotActivity.mockResolvedValue({
      added: { today: 0, last_3_days: 0, last_7_days: 1 },
      updated: { today: 0, last_3_days: 1, last_7_days: 1 },
    });
    await show();
    expect(screen.getByRole("region", { name: "Lot activity" }).textContent).toBe(
      "1 new lot in the last 7 days1 lot updated in the last 7 days",
    );
  });

  it("still lists the lots when the summary cannot be had", async () => {
    getLotActivity.mockRejectedValue(new Error("API down"));
    await show();
    expect(screen.queryByRole("region", { name: "Lot activity" })).toBeNull();
    expect(cards()).toHaveLength(PAGE_SIZE);
  });

  it("lists a page of lots for a signed-in dealer, a card each", async () => {
    await show();
    expect(listLots).toHaveBeenCalledWith({}, 1, "token-abc", null, "America/New_York");
    expect(cards()).toHaveLength(PAGE_SIZE);
    const card = cards()[0];
    expect(within(card).getByRole("link").getAttribute("href")).toBe("/active-lots/copart/41633100");
    expect(card.textContent).toContain("120,500 mi");
    expect(card.textContent).toContain("$8,119");
  });

  it("asks for the requested page and offers the neighbouring ones", async () => {
    listLots.mockResolvedValue({ items: lots(PAGE_SIZE), total: 145 });
    await show("3");
    expect(listLots).toHaveBeenCalledWith({}, 3, "token-abc", null, "America/New_York");
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(pagination.textContent).toContain("41–60 of 145, page 3 of 8");
    expect(screen.getByRole("link", { name: "Previous" }).getAttribute("href")).toBe("/active-lots?page=2");
    expect(screen.getByRole("link", { name: "Next" }).getAttribute("href")).toBe("/active-lots?page=4");
  });

  it("disables previous on the first page and next on the last", async () => {
    listLots.mockResolvedValue({ items: lots(5), total: 5 });
    await show();
    expect(screen.queryByRole("link", { name: "Previous" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Next" })).toBeNull();
    for (const label of ["Previous", "Next"]) {
      expect(screen.getByText(label).getAttribute("aria-disabled")).toBe("true");
    }
  });

  it("says so when the requested page is past the end", async () => {
    listLots.mockResolvedValue({ items: [], total: 145 });
    await show("99");
    expect(screen.getByText("No lots on this page.")).toBeTruthy();
  });
});

describe("active lots with little data", () => {
  it("links the second page back to the plain listing", async () => {
    await show("2");
    expect(screen.getByRole("link", { name: "Previous" }).getAttribute("href")).toBe("/active-lots");
  });

  it("says no lot matches when there are none", async () => {
    listLots.mockResolvedValue({ items: [], total: 0 });
    await show();
    expect(screen.getByText("No lots match these filters.")).toBeTruthy();
  });
});

describe("search and filters", () => {
  it("lists the lots the URL's valid filters ask for, and hands them to the filter bar", async () => {
    getLotPreferences.mockResolvedValue({ filters: "sort=year&evil=1", usage: { state: 4 } });
    await show({ title: ["salvage", "rebuilt"], sort: "sale", page: "2" });
    expect(listLots).toHaveBeenCalledWith({ title: ["salvage"], sort: ["sale"] }, 2, "token-abc", null, "America/New_York");
    expect(filterProps).toHaveBeenCalledWith({
      query: { title: ["salvage"], sort: ["sale"] },
      total: 145,
      usage: { state: 4 },
      remembered: "sort=year",
    });
  });

  it("keeps the filters in the pagination links", async () => {
    await show({ title: "salvage", page: "2" });
    expect(screen.getByRole("link", { name: "Previous" }).getAttribute("href")).toBe("/active-lots?title=salvage");
    expect(screen.getByRole("link", { name: "Next" }).getAttribute("href")).toBe("/active-lots?title=salvage&page=3");
  });

  it("opens the lot a lot number or VIN names", async () => {
    interpretSearch.mockResolvedValue({ lot: { source: "copart", lot_number: "41633100" } });
    await expect(show({ q: "41633100" })).rejects.toThrow("REDIRECT /active-lots/copart/41633100");
    expect(interpretSearch).toHaveBeenCalledWith("41633100", "token-abc", null);
    expect(listLots).not.toHaveBeenCalled();
  });

  it("turns a make, model and years into filters", async () => {
    interpretSearch.mockResolvedValue({ lot: null, make: "TOYOTA", model: "RAV4", year_min: 2018, year_max: 2021, q: "" });
    await expect(show({ q: "2018-2021 toyota rav4", title: "clean" })).rejects.toThrow(
      "REDIRECT /active-lots?make=TOYOTA&model=RAV4&year_min=2018&year_max=2021&title=clean",
    );
  });

  it("searches words that name no lot, make or year as keywords", async () => {
    interpretSearch.mockResolvedValue({ lot: null, make: null, model: null, year_min: null, year_max: null, q: "hybrid" });
    await show({ q: "hybrid" });
    expect(listLots).toHaveBeenCalledWith({ q: ["hybrid"] }, 1, "token-abc", null, "America/New_York");
  });

  it("brings the list back as the dealer left it when they arrive without parameters", async () => {
    getLotPreferences.mockResolvedValue({ filters: "title=clean&sort=year", usage: {} });
    await expect(show()).rejects.toThrow("REDIRECT /active-lots?title=clean&sort=year");
  });

  it("lists what the URL asks for, not what was kept, once there are parameters", async () => {
    getLotPreferences.mockResolvedValue({ filters: "title=clean&sort=year", usage: {} });
    await show({ sort: "newest" });
    expect(redirect).not.toHaveBeenCalled();
    expect(listLots).toHaveBeenCalledWith({ sort: ["newest"] }, 1, "token-abc", null, "America/New_York");
  });

  it("does not bring back kept filters that read as nothing", async () => {
    getLotPreferences.mockResolvedValue({ filters: "evil=1", usage: {} });
    await show();
    expect(redirect).not.toHaveBeenCalled();
  });
});
