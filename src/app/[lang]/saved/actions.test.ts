import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { en } from "@/messages/en";
import { es } from "@/messages/es";

const { saveLot, unsaveLot, createSearch, updateSearch, deleteSearch, sessionToken, visitorZone, cookieGet } = vi.hoisted(() => ({
  saveLot: vi.fn(),
  unsaveLot: vi.fn(),
  createSearch: vi.fn(),
  updateSearch: vi.fn(),
  deleteSearch: vi.fn(),
  sessionToken: vi.fn(),
  visitorZone: vi.fn(),
  /** The language cookie the proxy keeps: English unless a test sets it. */
  cookieGet: vi.fn<(name: string) => { value: string } | undefined>(),
}));
vi.mock("@/lib/saved", async (original) => ({ ...(await original<object>()), saveLot, unsaveLot, createSearch, updateSearch, deleteSearch }));
vi.mock("@/lib/session", () => ({ sessionToken, visitorZone, visitorIp: async () => "9.9.9.9" }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));

const { deleteSearchAction, saveLotAction, saveSearchAction, unsaveLotAction, updateSearchAction } = await import("./actions");

const LOT = { source: "copart", lot_number: "41633106" };
const ID = "5b0c3c8e-2f43-4b55-8f2e-0d5b0a7f1c11";
const failed = { error: en.saved.errors.failed };

beforeEach(() => {
  sessionToken.mockResolvedValue("sess");
  visitorZone.mockResolvedValue("America/New_York");
  cookieGet.mockReturnValue(undefined);
});
afterEach(() => vi.clearAllMocks());

describe("saveLotAction", () => {
  it("saves the lot and switches only what it names, with the page's language and the browser's zone", async () => {
    saveLot.mockResolvedValue({ lot: LOT, remind_hour: true });
    cookieGet.mockReturnValue({ value: "es" });
    const changes = { remind_hour: true, change_alerts: "yes", evil: true } as never;

    expect(await saveLotAction(LOT, changes, "America/Chicago")).toEqual({ value: { lot: LOT, remind_hour: true } });
    expect(saveLot).toHaveBeenCalledWith(LOT, { remind_hour: true, locale: "es", time_zone: "America/Chicago" }, "sess", "9.9.9.9");
  });

  it("falls back on the zone the lot list remembered, then on UTC", async () => {
    await saveLotAction(LOT, {}, "Mars/Olympus");
    expect(saveLot).toHaveBeenLastCalledWith(LOT, { locale: "en", time_zone: "America/New_York" }, "sess", "9.9.9.9");
    visitorZone.mockResolvedValue(null);
    await saveLotAction(LOT, {});
    expect(saveLot).toHaveBeenLastCalledWith(LOT, { locale: "en", time_zone: "UTC" }, "sess", "9.9.9.9");
  });

  it("says why the API refused, in the page's language", async () => {
    saveLot.mockRejectedValueOnce(new ApiError(409, "limit_reached", "An account keeps at most 500 saved lots."));
    expect(await saveLotAction(LOT, {})).toEqual({ error: en.saved.errors.lots });
    cookieGet.mockReturnValue({ value: "es" });
    saveLot.mockRejectedValueOnce(new ApiError(404, "lot_not_found", "This lot is no longer listed."));
    expect(await saveLotAction(LOT, {})).toEqual({ error: es.saved.errors.gone });
    saveLot.mockRejectedValueOnce(new ApiError(0, "unavailable", "down"));
    expect(await saveLotAction(LOT, {})).toEqual({ error: es.saved.errors.failed });
  });

  it("asks nothing of the API without a session or a lot", async () => {
    sessionToken.mockResolvedValueOnce(undefined);
    expect(await saveLotAction(LOT, {})).toEqual(failed);
    for (const lot of [null, { source: "", lot_number: "1" }, { source: "copart", lot_number: "1".repeat(41) }, { source: "copart" }]) {
      expect(await saveLotAction(lot as never, {})).toEqual(failed);
    }
    expect(saveLot).not.toHaveBeenCalled();
  });
});

describe("unsaveLotAction", () => {
  it("removes the lot", async () => {
    expect(await unsaveLotAction(LOT)).toEqual({ value: null });
    expect(unsaveLot).toHaveBeenCalledWith(LOT, "sess", "9.9.9.9");
  });

  it("says when that failed, and asks nothing without a session or a lot", async () => {
    unsaveLot.mockRejectedValueOnce(new ApiError(0, "unavailable", "down"));
    expect(await unsaveLotAction(LOT)).toEqual(failed);
    sessionToken.mockResolvedValueOnce(undefined);
    expect(await unsaveLotAction(LOT)).toEqual(failed);
    expect(await unsaveLotAction({} as never)).toEqual(failed);
    expect(unsaveLot).toHaveBeenCalledTimes(1);
  });
});

describe("saveSearchAction", () => {
  it("keeps the name, and the query's valid filters and words without its order", async () => {
    createSearch.mockResolvedValue({ id: ID });

    expect(await saveSearchAction({ name: "  Camry ", query: "sort=sale&make=TOYOTA&evil=1", alerts: true }, "UTC")).toEqual({ value: { id: ID } });
    expect(createSearch).toHaveBeenCalledWith(
      { name: "Camry", query: "make=TOYOTA", alerts: true, locale: "en", time_zone: "UTC" },
      "sess",
      "9.9.9.9",
    );
  });

  it("refuses a missing or overlong name, a query that is not a string, or alerts that are not a switch", async () => {
    for (const input of [
      { name: "  ", query: "", alerts: false },
      { name: "x".repeat(81), query: "", alerts: false },
      { name: "Camry", query: 7, alerts: false },
      { name: "Camry", query: "", alerts: "yes" },
      null,
    ]) {
      expect(await saveSearchAction(input as never)).toEqual(failed);
    }
    expect(createSearch).not.toHaveBeenCalled();
  });

  it("says when the account keeps as many searches as it may", async () => {
    createSearch.mockRejectedValue(new ApiError(409, "limit_reached", "An account keeps at most 50 saved searches."));
    expect(await saveSearchAction({ name: "Camry", query: "", alerts: false })).toEqual({ error: en.saved.errors.searches });
  });
});

describe("updateSearchAction", () => {
  it("changes only what it is given", async () => {
    updateSearch.mockResolvedValue({ id: ID });

    expect(await updateSearchAction(ID, { alerts: false })).toEqual({ value: { id: ID } });
    expect(updateSearch).toHaveBeenLastCalledWith(ID, { alerts: false, locale: "en", time_zone: "America/New_York" }, "sess", "9.9.9.9");
    await updateSearchAction(ID, { name: " Hondas ", query: "make=HONDA&sort=year" });
    expect(updateSearch).toHaveBeenLastCalledWith(
      ID,
      { name: "Hondas", query: "make=HONDA", locale: "en", time_zone: "America/New_York" },
      "sess",
      "9.9.9.9",
    );
  });

  it("says when the API refused the change", async () => {
    updateSearch.mockRejectedValueOnce(new ApiError(404, "not_found", "This saved search does not exist."));
    expect(await updateSearchAction(ID, { alerts: true })).toEqual(failed);
  });

  it("refuses what is not a search id or a valid change", async () => {
    expect(await updateSearchAction("../../me", { alerts: false })).toEqual(failed);
    expect(await updateSearchAction(ID, { name: "" })).toEqual(failed);
    expect(updateSearch).not.toHaveBeenCalled();
  });
});

describe("deleteSearchAction", () => {
  it("deletes the search", async () => {
    expect(await deleteSearchAction(ID)).toEqual({ value: null });
    expect(deleteSearch).toHaveBeenCalledWith(ID, "sess", "9.9.9.9");
  });

  it("refuses what is not a search id, and says when the API failed", async () => {
    expect(await deleteSearchAction(42 as never)).toEqual(failed);
    deleteSearch.mockRejectedValueOnce(new ApiError(0, "unavailable", "down"));
    expect(await deleteSearchAction(ID)).toEqual(failed);
  });
});
