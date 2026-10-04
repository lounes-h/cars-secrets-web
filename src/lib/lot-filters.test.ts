import { describe, expect, it } from "vitest";
import {
  activeIds,
  amountIn,
  chips,
  COUNTED,
  edit,
  filterById,
  knownZone,
  listPath,
  paramsOf,
  PRIMARY,
  promoted,
  queryString,
  readQuery,
  rememberable,
  searched,
  valueLabel,
} from "@/lib/lot-filters";

const read = (search: string) => readQuery(new URLSearchParams(search));

describe("readQuery", () => {
  it("keeps what the list understands, in one order whatever the URL's", () => {
    const query = read("sort=sale&damage=SIDE&title=salvage&q=  2019   camry &damage=FRONT%20END&page=3&evil=1");
    expect(query).toEqual({ q: ["2019 camry"], title: ["salvage"], damage: ["SIDE", "FRONT END"], sort: ["sale"] });
    expect(queryString(query)).toBe("q=2019+camry&title=salvage&damage=SIDE&damage=FRONT+END&sort=sale");
  });

  it("reads Next's search params, single or repeated", () => {
    expect(readQuery({ title: ["clean", "salvage"], run: "verified", page: "2", missing: undefined })).toEqual({
      title: ["clean", "salvage"],
      run: ["verified"],
    });
  });

  it("drops options a filter does not have, and repeats", () => {
    expect(read("title=rebuilt&title=clean&title=clean&run=maybe&sort=cheapest&location=moon")).toEqual({
      title: ["clean"],
    });
  });

  it("takes one value for a one-choice filter", () => {
    expect(read("sale=today&sale=future&make=TOYOTA&make=HONDA")).toEqual({ sale: ["today"], make: ["TOYOTA"] });
  });

  it("caps lists, values and the search", () => {
    const many = Array.from({ length: 60 }, (_, i) => `damage=D${i}`).join("&");
    expect(read(many).damage).toHaveLength(50);
    expect(read(`state=${"X".repeat(101)}`)).toEqual({});
    expect(read(`q=${"a".repeat(300)}`).q[0]).toHaveLength(200);
    expect(read("q=%20%20")).toEqual({});
  });

  it("keeps whole numbers only, and plausible years", () => {
    expect(read("year_min=2018&year_max=1800&odometer_max=100000&retail_min=-5&retail_max=1.5&bin_max=abc&bid_max=0")).toEqual({
      year_min: ["2018"],
      odometer_max: ["100000"],
      bid_max: ["0"],
    });
    expect(read("odometer_max=0100")).toEqual({ odometer_max: ["100"] });
  });

  it("reads a switch as on or off", () => {
    expect(read("buy_now=true")).toEqual({ buy_now: ["1"] });
    expect(read("buy_now=1")).toEqual({ buy_now: ["1"] });
    expect(read("buy_now=no")).toEqual({});
  });
});

describe("edit", () => {
  it("sets and removes parameters, keeping the order", () => {
    const query = read("title=salvage&sort=sale");
    expect(queryString(edit(query, { sort: null, q: ["rav4"], run: ["starts"] }))).toBe("q=rav4&title=salvage&run=starts");
    expect(edit(query, { title: [] })).toEqual({ sort: ["sale"] });
  });
});

describe("listPath", () => {
  it("is the list's address for a query and page", () => {
    expect(listPath({})).toBe("/active-lots");
    expect(listPath({}, 2)).toBe("/active-lots?page=2");
    expect(listPath(read("title=clean"), 1)).toBe("/active-lots?title=clean");
    expect(listPath(read("title=clean"), 3)).toBe("/active-lots?title=clean&page=3");
  });
});

describe("rememberable", () => {
  it("keeps filters and order but not the words of a search", () => {
    expect(rememberable(read("q=hybrid&title=clean&sort=year"))).toEqual({ title: ["clean"], sort: ["year"] });
  });
});

describe("activeIds", () => {
  it("names the filters with a value chosen, ranges included", () => {
    expect(activeIds(read("q=x&odometer_max=5&title=clean&sort=year"))).toEqual(["title", "mileage"]);
  });
});

describe("searched", () => {
  const none = { make: null, model: null, year_min: null, year_max: null, q: "white" };

  it("is null when a search names no make or years", () => {
    expect(searched(read("q=white"), none)).toBeNull();
  });

  it("turns a make, model and years into filters, keeping the other words", () => {
    const found = { make: "TOYOTA", model: "RAV4", year_min: 2018, year_max: 2021, q: "white" };
    expect(searched(read("q=2018-2021 toyota rav4 white&title=clean"), found)).toEqual({
      q: ["white"],
      title: ["clean"],
      year_min: ["2018"],
      year_max: ["2021"],
      make: ["TOYOTA"],
      model: ["RAV4"],
    });
  });

  it("drops the model of another make, and keeps one when only years were named", () => {
    expect(searched(read("q=honda&make=TOYOTA&model=RAV4"), { ...none, make: "HONDA", q: "" })).toEqual({ make: ["HONDA"] });
    expect(searched(read("q=2019&make=TOYOTA&model=RAV4"), { ...none, year_min: 2019, year_max: 2019, q: "" })).toEqual({
      year_min: ["2019"],
      year_max: ["2019"],
      make: ["TOYOTA"],
      model: ["RAV4"],
    });
  });
});

describe("promoted", () => {
  it("moves the most used filters from All filters into the bar, two at most", () => {
    expect(promoted({ state: 9, keys: 3, year_max: 5, title: 50, model: 40, damage2: 2 })).toEqual(["state", "year"]);
  });

  it("promotes nothing used fewer than three times", () => {
    expect(promoted({ state: 2 })).toEqual([]);
    expect(promoted({})).toEqual([]);
  });
});

describe("the filters", () => {
  it("put sale date, title, condition and damage in the bar", () => {
    expect(PRIMARY).toEqual(["sale", "title", "run", "damage"]);
  });

  it("count every filter but the ranges", () => {
    expect(COUNTED).not.toContain("year");
    expect(COUNTED).toContain("buy_now");
    expect(paramsOf(filterById("retail"))).toEqual(["retail_min", "retail_max"]);
    expect(paramsOf(filterById("bin"))).toEqual(["bin_max"]);
  });

  it("word codes as the lot page does", () => {
    expect(valueLabel(filterById("run"), "unverified")).toBe("Not verified to start");
    expect(valueLabel(filterById("sale_type"), "approval")).toBe("Seller must approve");
    expect(valueLabel(filterById("vehicle_type"), "k")).toBe("Medium duty / box truck");
    expect(valueLabel(filterById("vehicle_type"), "Q")).toBe("Q");
    expect(valueLabel(filterById("source"), "copart")).toBe("Copart");
    expect(valueLabel(filterById("damage"), "FRONT END")).toBe("FRONT END");
  });

  it("show amounts in their unit", () => {
    expect(amountIn("$", "15000")).toBe("$15,000");
    expect(amountIn("mi", "100000")).toBe("100,000 mi");
    expect(amountIn("year", "2018")).toBe("2018");
  });
});

describe("chips", () => {
  it("make one removable chip per chosen value, and one per range", () => {
    const query = read(
      "q=hybrid&sale=today&title=salvage&run=starts&damage=SIDE&vehicle_type=V&buy_now=1&make=TOYOTA&model=RAV4&year_min=2018&year_max=2021&odometer_max=100000&retail_min=5000&bid_max=900&sort=sale",
    );
    expect(chips(query).map((chip) => chip.label)).toEqual([
      "“hybrid”",
      "Sells today",
      "Salvage title",
      "Engine starts only",
      "Damage: SIDE",
      "Year 2018–2021",
      "TOYOTA",
      "RAV4",
      "Mileage up to 100,000 mi",
      "Vehicle type: Automobile",
      "Buy now available",
      "Retail value from $5,000",
      "Current bid up to $900",
    ]);
  });

  it("remove only their own value, a range's bounds together, and a make's model with it", () => {
    const query = read("title=salvage&title=clean&year_min=2018&year_max=2021&make=TOYOTA&model=RAV4&sort=sale");
    const without = Object.fromEntries(chips(query).map((chip) => [chip.key, queryString(chip.without)]));
    expect(without["title:salvage"]).toBe("title=clean&year_min=2018&year_max=2021&make=TOYOTA&model=RAV4&sort=sale");
    expect(without.year).toBe("title=salvage&title=clean&make=TOYOTA&model=RAV4&sort=sale");
    expect(without["make:TOYOTA"]).toBe("title=salvage&title=clean&year_min=2018&year_max=2021&sort=sale");
    expect(without["model:RAV4"]).toBe("title=salvage&title=clean&year_min=2018&year_max=2021&make=TOYOTA&sort=sale");
  });

  it("are none for an order alone", () => {
    expect(chips(read("sort=year"))).toEqual([]);
  });

  it("say Future sale as Copart does", () => {
    expect(chips(read("sale=future"))[0].label).toBe("Future sale");
  });
});

describe("knownZone", () => {
  it("keeps a zone the runtime knows, and nothing else", () => {
    expect(knownZone("America/New_York")).toBe("America/New_York");
    expect(knownZone("Mars/Olympus")).toBeNull();
    expect(knownZone("x".repeat(65))).toBeNull();
    expect(knownZone(undefined)).toBeNull();
    expect(knownZone("")).toBeNull();
  });
});
