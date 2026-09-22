import { describe, expect, it, vi } from "vitest";

const api = vi.fn(async () => ({ items: [], total: 0 }));
vi.mock("@/lib/api", () => ({ api }));

const { listLots, pageCount, pageNumber, PAGE_SIZE } = await import("@/lib/lots");

describe("pageNumber", () => {
  it("keeps a whole page number above one", () => {
    expect(pageNumber("7")).toBe(7);
  });

  it("falls back to the first page for anything else", () => {
    for (const value of [undefined, "", "0", "-3", "1.5", "two", "9999999999999999999999x"]) {
      expect(pageNumber(value), String(value)).toBe(1);
    }
  });
});

describe("pageCount", () => {
  it("counts a partial last page", () => {
    expect(pageCount(PAGE_SIZE * 3 + 1)).toBe(4);
  });

  it("is one page when there is nothing", () => {
    expect(pageCount(0)).toBe(1);
  });
});

describe("listLots", () => {
  it("asks the API for the page's slice with the dealer's token", async () => {
    await listLots(3, "token-abc", "203.0.113.4");
    expect(api).toHaveBeenCalledWith(`/api/lots?limit=${PAGE_SIZE}&offset=${PAGE_SIZE * 2}`, {
      token: "token-abc",
      clientIp: "203.0.113.4",
    });
  });
});
