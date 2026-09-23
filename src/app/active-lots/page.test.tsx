// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Lot } from "@/lib/lots";
import { sampleLot } from "@/lib/lots-fixture";

const currentUser = vi.fn();
const listLots = vi.fn();

vi.mock("@/lib/session", () => ({
  currentUser,
  sessionToken: async () => "token-abc",
  visitorIp: async () => null,
}));
vi.mock("@/lib/lots", async (original) => ({ ...(await original<object>()), listLots }));

const { default: AuctionsPage } = await import("@/app/active-lots/page");
const { PAGE_SIZE } = await import("@/lib/lots");

const LOT: Lot = sampleLot;

function lots(n: number): Lot[] {
  return Array.from({ length: n }, (_, i) => ({ ...LOT, lot_number: `4163310${i}` }));
}

async function show(page?: string) {
  render(await AuctionsPage({ searchParams: Promise.resolve({ page }) }));
}

beforeEach(() => {
  currentUser.mockResolvedValue({ id: "u1", email: "dealer@example.com" });
  listLots.mockResolvedValue({ items: lots(PAGE_SIZE), total: 145 });
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
    expect(listLots).toHaveBeenCalledWith(1, "token-abc", null);
    expect(screen.getAllByRole("row")).toHaveLength(PAGE_SIZE + 1);
    expect(screen.getByRole("link", { name: "41633100" }).getAttribute("href")).toBe(
      "/active-lots/copart/41633100",
    );
    const row = screen.getAllByRole("row")[1];
    expect(row.textContent).toContain("2013 ACURA TSX");
    expect(row.textContent).toContain("120,500 mi");
    expect(row.textContent).toContain("$8,119");
  });

  it("asks for the requested page and offers the neighbouring ones", async () => {
    listLots.mockResolvedValue({ items: lots(PAGE_SIZE), total: 145 });
    await show("3");
    expect(listLots).toHaveBeenCalledWith(3, "token-abc", null);
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
