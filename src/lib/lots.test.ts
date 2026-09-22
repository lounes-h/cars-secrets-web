import { describe, expect, it, vi } from "vitest";

const api = vi.fn<(path: string, options: unknown) => Promise<unknown>>();
vi.mock("@/lib/api", async (original) => ({ ...(await original<object>()), api }));

const { ApiError } = await import("@/lib/api");

const { getLot, getLotImages, listLots, pageCount, pageNumber, PAGE_SIZE } = await import("@/lib/lots");

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
    api.mockResolvedValue({ items: [], total: 0 });
    await listLots(3, "token-abc", "203.0.113.4");
    expect(api).toHaveBeenCalledWith(`/api/lots?limit=${PAGE_SIZE}&offset=${PAGE_SIZE * 2}`, {
      token: "token-abc",
      clientIp: "203.0.113.4",
    });
  });
});

describe("getLotImages", () => {
  it("asks the API for the lot's photos, escaping what came from the URL", async () => {
    const images = [{ thumb: "https://cs.copart.example/a_thb.jpg", full: null }];
    api.mockResolvedValue({ images });
    expect(await getLotImages("copart", "a/b 1", "token-abc")).toEqual(images);
    expect(api).toHaveBeenCalledWith("/api/lots/copart/a%2Fb%201/images", {
      token: "token-abc",
      clientIp: null,
    });
  });

  it("has no photos to show when the API cannot answer, rather than failing the page", async () => {
    api.mockRejectedValue(new ApiError(0, "unavailable", "down"));
    expect(await getLotImages("copart", "1", "token-abc")).toEqual([]);
  });
});

describe("getLot", () => {
  it("asks the API for one lot, escaping what came from the URL", async () => {
    api.mockResolvedValue({});
    await getLot("copart", "a/b 1", "token-abc");
    expect(api).toHaveBeenCalledWith("/api/lots/copart/a%2Fb%201", { token: "token-abc", clientIp: null });
  });

  it("is null when the auction no longer lists the lot", async () => {
    api.mockRejectedValue(new ApiError(404, "unavailable", "gone"));
    expect(await getLot("copart", "404", "token-abc")).toBeNull();
  });

  it("lets any other failure through, so the page does not claim the lot is gone", async () => {
    api.mockRejectedValue(new ApiError(0, "unavailable", "down"));
    await expect(getLot("copart", "1", "token-abc")).rejects.toThrow("down");
  });
});
