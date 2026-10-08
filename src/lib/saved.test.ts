import { afterEach, describe, expect, it, vi } from "vitest";

const api = vi.fn<(path: string, options: unknown) => Promise<unknown>>();
vi.mock("@/lib/api", async (original) => ({ ...(await original<object>()), api }));

const { ApiError } = await import("@/lib/api");
const { createSearch, deleteSearch, getSavedLot, getSavedLots, getSavedSearches, keyOf, saveLot, unsaveLot, updateSearch } = await import("@/lib/saved");

const LOT = { source: "copart", lot_number: "41633106" };
const HERE = { locale: "es", time_zone: "America/Chicago" } as const;

afterEach(() => api.mockReset());

describe("saved lots", () => {
  it("lists the dealer's saved lots", async () => {
    api.mockResolvedValue({ items: [{ lot: LOT, available: true }] });
    expect(await getSavedLots("tok", "9.9.9.9")).toEqual([{ lot: LOT, available: true }]);
    expect(api).toHaveBeenCalledWith("/api/me/saved-lots", { token: "tok", clientIp: "9.9.9.9" });
  });

  it("keys a lot by its auction and number", () => {
    expect(keyOf(LOT)).toBe("copart/41633106");
  });

  it("finds one saved lot, or null when it is not saved", async () => {
    api.mockResolvedValue({ lot: LOT, available: true });
    expect(await getSavedLot({ source: "co part", lot_number: "1/2" }, "tok")).toEqual({ lot: LOT, available: true });
    expect(api).toHaveBeenCalledWith("/api/me/saved-lots/co%20part/1%2F2", { token: "tok", clientIp: null });
    api.mockRejectedValue(new ApiError(404, "not_saved", "This lot is not saved."));
    expect(await getSavedLot(LOT, "tok")).toBeNull();
    api.mockRejectedValue(new ApiError(0, "unavailable", "down"));
    await expect(getSavedLot(LOT, "tok")).rejects.toThrow("down");
  });

  it("saves a lot with what to switch, and the dealer's language and zone", async () => {
    api.mockResolvedValue({ lot: LOT, remind_hour: true });
    await saveLot(LOT, { remind_hour: true, ...HERE }, "tok", "9.9.9.9");
    expect(api).toHaveBeenCalledWith("/api/me/saved-lots/copart/41633106", {
      method: "PUT",
      body: { remind_hour: true, locale: "es", time_zone: "America/Chicago" },
      token: "tok",
      clientIp: "9.9.9.9",
    });
  });

  it("removes a saved lot", async () => {
    api.mockResolvedValue({ ok: true });
    await unsaveLot(LOT, "tok");
    expect(api).toHaveBeenCalledWith("/api/me/saved-lots/copart/41633106", { method: "DELETE", token: "tok", clientIp: null });
  });
});

describe("saved searches", () => {
  it("lists, creates, changes and deletes them", async () => {
    api.mockResolvedValue({ items: [{ id: "s1" }] });
    expect(await getSavedSearches("tok")).toEqual([{ id: "s1" }]);
    expect(api).toHaveBeenLastCalledWith("/api/me/saved-searches", { token: "tok", clientIp: null });

    api.mockResolvedValue({ id: "s1" });
    await createSearch({ name: "Camry", query: "make=TOYOTA", alerts: true, ...HERE }, "tok");
    expect(api).toHaveBeenLastCalledWith("/api/me/saved-searches", {
      method: "POST",
      body: { name: "Camry", query: "make=TOYOTA", alerts: true, locale: "es", time_zone: "America/Chicago" },
      token: "tok",
      clientIp: null,
    });
    await updateSearch("s/1", { alerts: false, ...HERE }, "tok");
    expect(api).toHaveBeenLastCalledWith("/api/me/saved-searches/s%2F1", {
      method: "PATCH",
      body: { alerts: false, locale: "es", time_zone: "America/Chicago" },
      token: "tok",
      clientIp: null,
    });
    await deleteSearch("s1", "tok", "9.9.9.9");
    expect(api).toHaveBeenLastCalledWith("/api/me/saved-searches/s1", { method: "DELETE", token: "tok", clientIp: "9.9.9.9" });
  });
});
