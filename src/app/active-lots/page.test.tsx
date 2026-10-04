// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Lot } from "@/lib/lots";
import { sampleLot } from "@/lib/lots-fixture";

const currentUser = vi.fn();
const listLots = vi.fn();
const interpretSearch = vi.fn();
const getLotPreferences = vi.fn();
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
vi.mock("@/lib/lots", async (original) => ({ ...(await original<object>()), listLots, interpretSearch, getLotPreferences }));
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
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("active lots page", () => {
  it("asks a visitor to sign in instead of listing lots", async () => {
    currentUser.mockResolvedValue(null);
    await show();
    expect(screen.getByRole("link", { name: "Sign in to see the lots" }).getAttribute("href")).toBe("/login");
    expect(listLots).not.toHaveBeenCalled();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("lists a page of lots for a signed-in dealer", async () => {
    await show();
    expect(listLots).toHaveBeenCalledWith({}, 1, "token-abc", null, "America/New_York");
    expect(screen.getAllByRole("row")).toHaveLength(PAGE_SIZE + 1);
    expect(screen.getByRole("link", { name: "41633100" }).getAttribute("href")).toBe(
      "/active-lots/copart/41633100",
    );
    const row = screen.getAllByRole("row")[1];
    expect(row.textContent).toContain("2013 ACURA TSX");
    expect(row.textContent).toContain("120,500 mi");
    expect(row.textContent).toContain("$8,119");
    // The sale in the reader's zone (UTC in tests), which the browser rewrites before painting.
    expect(row.querySelector("time")?.getAttribute("datetime")).toBe("2026-09-18T19:00:00Z");
    expect(row.textContent).toContain("Sep 18, 2026, 7:00 PM UTC");
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

describe("amounts", () => {
  it("marks the location of a lot held away from the yard as offsite", async () => {
    listLots.mockResolvedValue({ items: [{ ...LOT, offsite_address: "645 W UNION ST" }, LOT], total: 2 });
    await show();
    const [, offsite, onYard] = screen.getAllByRole("row");
    expect(offsite.textContent).toContain("VALLEJO, CA · Offsite");
    expect(onYard.textContent).not.toContain("Offsite");
  });

  it("shows a lot's own currency, and falls back to dollars for a junk code", async () => {
    listLots.mockResolvedValue({
      items: [
        { ...LOT, lot_number: "1", currency: "CAD" },
        { ...LOT, lot_number: "2", currency: "n/a" },
        { ...LOT, lot_number: "3", est_retail_value: null },
      ],
      total: 3,
    });
    await show();
    const [, cad, junk, missing] = screen.getAllByRole("row");
    expect(cad.textContent).toContain("CA$8,119");
    expect(junk.textContent).toContain("$8,119");
    expect(missing.textContent).toContain("—");
  });
});

describe("active lots with little data", () => {
  it("links the second page back to the plain listing and shows dashes for missing columns", async () => {
    listLots.mockResolvedValue({ items: [{ ...LOT, damage_primary: null, title_type: null }], total: 145 });
    await show("2");
    expect(screen.getByRole("link", { name: "Previous" }).getAttribute("href")).toBe("/active-lots");
    expect(screen.getAllByRole("row")[1].textContent).toContain("—");
  });

  it("says no lot matches when there are none", async () => {
    listLots.mockResolvedValue({ items: [], total: 0 });
    await show();
    expect(screen.getByText("No lots match these filters.")).toBeTruthy();
  });

  it("says when the sale is not set yet, and shows a sale day without a time as the auction gives it", async () => {
    listLots.mockResolvedValue({
      items: [
        { ...LOT, lot_number: "1", sale_at: null, sale_date: null },
        { ...LOT, lot_number: "2", sale_at: null, sale_date: "2026-10-20" },
      ],
      total: 2,
    });
    await show();
    const [, future, day] = screen.getAllByRole("row");
    expect(future.textContent).toContain("Future sale");
    expect(day.textContent).toContain("Oct 20, 2026");
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
      "REDIRECT /active-lots?title=clean&year_min=2018&year_max=2021&make=TOYOTA&model=RAV4",
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
