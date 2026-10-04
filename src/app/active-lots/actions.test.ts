import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { countLots, saveLotPreferences, sessionToken } = vi.hoisted(() => ({
  countLots: vi.fn(),
  saveLotPreferences: vi.fn(),
  sessionToken: vi.fn(),
}));
vi.mock("@/lib/lots", async (original) => ({ ...(await original<object>()), countLots, saveLotPreferences }));
vi.mock("@/lib/session", () => ({
  sessionToken,
  visitorIp: async () => "9.9.9.9",
  visitorZone: async () => "America/New_York",
}));

const { lotCountsAction, rememberLotFiltersAction } = await import("./actions");

beforeEach(() => sessionToken.mockResolvedValue("sess"));
afterEach(() => vi.clearAllMocks());

describe("lotCountsAction", () => {
  it("counts the known filters asked for, under the query's valid filters", async () => {
    countLots.mockResolvedValue({ title: [{ value: "clean", count: 2 }] });
    const facets = await lotCountsAction("title=clean&evil=1&run=nope", ["title", "price", "sale"]);
    expect(facets).toEqual({ title: [{ value: "clean", count: 2 }] });
    expect(countLots).toHaveBeenCalledWith({ title: ["clean"] }, ["sale", "title"], "sess", "9.9.9.9", "America/New_York");
  });

  it("counts nothing without a session, a known filter or a query string", async () => {
    sessionToken.mockResolvedValueOnce(undefined);
    expect(await lotCountsAction("", ["title"])).toEqual({});
    expect(await lotCountsAction("", ["price"])).toEqual({});
    expect(await lotCountsAction("", "title" as unknown as string[])).toEqual({});
    expect(await lotCountsAction(42 as unknown as string, ["title"])).toEqual({});
    expect(countLots).not.toHaveBeenCalled();
  });

  it("has no counts when the API fails, rather than an error", async () => {
    countLots.mockRejectedValue(new Error("down"));
    expect(await lotCountsAction("", ["title"])).toEqual({});
  });
});

describe("rememberLotFiltersAction", () => {
  it("keeps the valid filters and order, without the words of a search", async () => {
    await rememberLotFiltersAction("q=hybrid&sort=year&title=clean&evil=1");
    expect(saveLotPreferences).toHaveBeenCalledWith("title=clean&sort=year", "sess", "9.9.9.9");
  });

  it("does nothing without a session or a query string", async () => {
    sessionToken.mockResolvedValueOnce(undefined);
    await rememberLotFiltersAction("title=clean");
    await rememberLotFiltersAction(null as unknown as string);
    expect(saveLotPreferences).not.toHaveBeenCalled();
  });

  it("lets the list work when the API cannot keep them", async () => {
    saveLotPreferences.mockRejectedValue(new Error("down"));
    await expect(rememberLotFiltersAction("title=clean")).resolves.toBeUndefined();
  });
});
