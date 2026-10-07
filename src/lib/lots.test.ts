import { describe, expect, it, vi } from "vitest";
import { en } from "@/messages/en";
import { es } from "@/messages/es";

const api = vi.fn<(path: string, options: unknown) => Promise<unknown>>();
vi.mock("@/lib/api", async (original) => ({ ...(await original<object>()), api }));

const { ApiError } = await import("@/lib/api");

const {
  ACTIVITY_MIN,
  activityWindow,
  amount,
  odometer,
  auctionName,
  countLots,
  getLotActivity,
  getLot,
  getLotImages,
  getLotPreferences,
  interpretSearch,
  listLots,
  pageCount,
  pageNumber,
  PAGE_SIZE,
  saleDate,
  saveLotPreferences,
  sellerName,
} = await import("@/lib/lots");
const { sampleLot } = await import("@/lib/lots-fixture");

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
    await listLots({}, 3, "token-abc", "203.0.113.4");
    expect(api).toHaveBeenCalledWith(`/api/lots?limit=${PAGE_SIZE}&offset=${PAGE_SIZE * 2}`, {
      token: "token-abc",
      clientIp: "203.0.113.4",
    });
  });

  it("passes the filters and the dealer's zone as the API's own parameters", async () => {
    api.mockResolvedValue({ items: [], total: 0 });
    await listLots({ title: ["salvage", "clean"], sale: ["today"], sort: ["sale"] }, 1, "token-abc", null, "America/New_York");
    expect(api).toHaveBeenCalledWith(
      `/api/lots?title=salvage&title=clean&sale=today&sort=sale&tz=America%2FNew_York&limit=${PAGE_SIZE}&offset=0`,
      { token: "token-abc", clientIp: null },
    );
  });
});

describe("countLots", () => {
  it("asks for the counts of the named filters under the query's others", async () => {
    const facets = { title: [{ value: "salvage", count: 3 }] };
    api.mockResolvedValue({ facets });
    expect(await countLots({ run: ["verified"] }, ["title", "run"], "token-abc", "1.2.3.4", "UTC")).toEqual(facets);
    expect(api).toHaveBeenCalledWith("/api/lots/counts?run=verified&tz=UTC&facets=title&facets=run", {
      token: "token-abc",
      clientIp: "1.2.3.4",
    });
    await countLots({}, ["sale"], "token-abc");
    expect(api).toHaveBeenLastCalledWith("/api/lots/counts?facets=sale", { token: "token-abc", clientIp: null });
  });
});

describe("getLotActivity", () => {
  it("asks for the counts in the dealer's zone, or the API's own without one", async () => {
    await getLotActivity("token-abc", "1.2.3.4", "America/New_York");
    expect(api).toHaveBeenCalledWith("/api/lots/activity?tz=America%2FNew_York", { token: "token-abc", clientIp: "1.2.3.4" });
    await getLotActivity("token-abc");
    expect(api).toHaveBeenLastCalledWith("/api/lots/activity", { token: "token-abc", clientIp: null });
  });
});

describe("activityWindow", () => {
  it("says today once today reaches the minimum", () => {
    expect(activityWindow({ today: ACTIVITY_MIN, last_3_days: 5000, last_7_days: 9000 })).toEqual({
      count: ACTIVITY_MIN,
      window: "today",
    });
  });

  it("looks back 3 days on a quiet day", () => {
    expect(activityWindow({ today: ACTIVITY_MIN - 1, last_3_days: 11821, last_7_days: 57043 })).toEqual({
      count: 11821,
      window: "last_3_days",
    });
  });

  it("falls back to the last 7 days, however few", () => {
    expect(activityWindow({ today: 3, last_3_days: 40, last_7_days: 120 })).toEqual({ count: 120, window: "last_7_days" });
    expect(activityWindow({ today: 0, last_3_days: 0, last_7_days: 0 })).toEqual({ count: 0, window: "last_7_days" });
  });
});

describe("interpretSearch", () => {
  it("asks the API what a search names", async () => {
    api.mockResolvedValue({ lot: null, make: "TOYOTA", model: null, year_min: null, year_max: null, q: "" });
    expect((await interpretSearch("toyota & co", "token-abc")).make).toBe("TOYOTA");
    expect(api).toHaveBeenCalledWith("/api/lots/interpret?q=toyota+%26+co", { token: "token-abc", clientIp: null });
  });
});

describe("lot preferences", () => {
  it("are read for the dealer", async () => {
    api.mockResolvedValue({ filters: "title=clean", usage: { title: 2 } });
    expect(await getLotPreferences("token-abc", "1.2.3.4")).toEqual({ filters: "title=clean", usage: { title: 2 } });
    expect(api).toHaveBeenCalledWith("/api/me/lot-preferences", { token: "token-abc", clientIp: "1.2.3.4" });
  });

  it("are none when the API cannot say, so the list still shows", async () => {
    api.mockRejectedValue(new ApiError(0, "unavailable", "down"));
    expect(await getLotPreferences("token-abc")).toEqual({ filters: "", usage: {} });
  });

  it("are saved with a PUT", async () => {
    api.mockResolvedValue({ filters: "sort=year", usage: { sort: 1 } });
    await saveLotPreferences("sort=year", "token-abc");
    expect(api).toHaveBeenCalledWith("/api/me/lot-preferences", {
      method: "PUT",
      body: { filters: "sort=year" },
      token: "token-abc",
      clientIp: null,
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

describe("amount", () => {
  it("shows the lot's own currency, falls back to dollars for a junk code, and is a dash for none", () => {
    expect(amount(8119, "CAD", "en")).toBe("CA$8,119");
    expect(amount(8119, "n/a", "en")).toBe("$8,119");
    expect(amount(null, "USD", "en")).toBe("—");
  });

  it("writes dollars as US Spanish does", () => {
    expect(amount(8119, "USD", "es")).toBe("$8,119");
  });
});

describe("odometer", () => {
  it("groups the miles in the page's language, and is a dash for none", () => {
    expect(odometer(120500, { locale: "en", m: en })).toBe("120,500 mi");
    expect(odometer(120500, { locale: "es", m: es })).toBe(es.lot.miles.replace("{miles}", "120,500"));
    expect(odometer(null, { locale: "en", m: en })).toBe("—");
  });
});

describe("saleDate", () => {
  it("shows a date column as a day, with no time of its own", () => {
    expect(saleDate("2026-10-01", "en")).toBe("Oct 1, 2026");
    expect(saleDate("2026-10-01", "es")).toBe("1 oct 2026");
  });

  it("keeps the auction's day in a zone behind UTC", () => {
    const zone = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    expect(saleDate("2026-10-01", "en")).toBe("Oct 1, 2026");
    process.env.TZ = zone;
  });

  it("is a dash when the auction published none", () => {
    expect(saleDate(null, "en")).toBe("—");
  });
});

describe("auctionName", () => {
  it("names the auction as it names itself", () => {
    expect(auctionName("copart")).toBe("Copart");
    expect(auctionName("iaa")).toBe("IAA");
    expect(auctionName("IAA")).toBe("IAA");
    expect(auctionName("manheim")).toBe("Manheim");
  });

  it("shows an auction it does not know as it came", () => {
    expect(auctionName("acv")).toBe("acv");
  });
});

describe("sellerName", () => {
  const name = (seller_name: string | null) => sellerName({ ...sampleLot, seller_name });

  it("drops the logo file Copart names some sellers by", () => {
    expect(name("ENTERPRISE-LOGO.jpeg")).toBe("ENTERPRISE");
    expect(name("VROOM-LOGO.png")).toBe("VROOM");
  });

  it("keeps any other name as it came, and nothing for none", () => {
    expect(name("State Farm Insurance")).toBe("State Farm Insurance");
    expect(name(" ")).toBeNull();
    expect(name(null)).toBeNull();
  });
});

describe("offsiteAddress", () => {
  it("is where a lot held away from the yard is picked up, and null at the yard", async () => {
    const { offsiteAddress } = await import("@/lib/lots");
    expect(offsiteAddress({ ...sampleLot, offsite_address: "645 W UNION ST", offsite_city: "ALLENTOWN", offsite_state: "PA", offsite_zip: "18101" })).toBe("645 W UNION ST, ALLENTOWN, PA 18101");
    expect(offsiteAddress({ ...sampleLot, offsite_address: "645 W UNION ST" })).toBe("645 W UNION ST");
    expect(offsiteAddress({ ...sampleLot, offsite_state: "PA", offsite_zip: "18101" })).toBe("PA 18101");
    expect(offsiteAddress(sampleLot)).toBeNull();
  });
});

describe("vehicle and place", () => {
  it("are a dash when the auction names neither", async () => {
    const { vehicle, place } = await import("@/lib/lots");
    const bare = { ...sampleLot, year: null, make: null, model: null, location_city: null, location_state: null };
    expect(vehicle(bare)).toBe("—");
    expect(place(bare)).toBe("—");
  });
});
