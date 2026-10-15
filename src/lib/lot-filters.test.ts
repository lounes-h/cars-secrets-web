import { describe, expect, it } from "vitest";
import { en } from "@/messages/en";
import { es } from "@/messages/es";
import {
  activeIds,
  amountIn,
  browserZone,
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
  searchName,
  searchQuery,
  valueLabel,
} from "@/lib/lot-filters";

const read = (search: string) => readQuery(new URLSearchParams(search));

const EN = { locale: "en", m: en } as const;

describe("readQuery", () => {
  it("keeps what the list understands, in one order whatever the URL's", () => {
    const query = read("sort=sale&damage=SIDE&title=salvage&q=  2019   camry &damage=FRONT%20END&page=3&evil=1");
    expect(query).toEqual({ q: ["2019 camry"], title: ["salvage"], damage: ["SIDE", "FRONT END"], sort: ["sale"] });
    expect(queryString(query)).toBe("q=2019+camry&damage=SIDE&damage=FRONT+END&title=salvage&sort=sale");
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
    expect(queryString(edit(query, { sort: null, q: ["rav4"], run: ["starts"] }))).toBe("q=rav4&run=starts&title=salvage");
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

  it("carries the saved search being edited, after the query and the page", () => {
    expect(listPath(read("title=clean"), 2, "s1")).toBe("/active-lots?title=clean&page=2&saved=s1");
    expect(listPath({}, 1, "s1")).toBe("/active-lots?saved=s1");
  });
});

describe("searchQuery", () => {
  it("is what a saved search keeps: the filters and the search words, not the order", () => {
    expect(searchQuery(read("sort=year&q=hybrid&title=clean"))).toBe("q=hybrid&title=clean");
    expect(searchQuery(read("sort=year"))).toBe("");
  });
});

describe("searchName", () => {
  it("names a search after its chips, or after every lot when it has none", () => {
    expect(searchName(read("year_min=2021&year_max=2025&title=salvage&make=TOYOTA&model=CAMRY"), EN)).toBe(
      "TOYOTA, CAMRY, Year 2021–2025, Salvage title",
    );
    expect(searchName(read("sort=year"), EN)).toBe("All lots");
    expect(searchName({}, { locale: "es", m: es })).toBe("Todos los lotes");
  });

  it("fits the 80 characters a name may have", () => {
    expect(searchName(read(`q=${"word ".repeat(30)}`), EN)).toHaveLength(80);
  });
});

describe("browserZone", () => {
  it("is the zone the browser runs in", () => {
    expect(browserZone()).toBe("UTC");
  });
});

describe("rememberable", () => {
  it("keeps filters and order but not the words of a search", () => {
    expect(rememberable(read("q=hybrid&title=clean&sort=year"))).toEqual({ title: ["clean"], sort: ["year"] });
  });
});

describe("activeIds", () => {
  it("names the filters with a value chosen, ranges included", () => {
    expect(activeIds(read("q=x&odometer_max=5&title=clean&sort=year"))).toEqual(["mileage", "title"]);
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
  it("moves the most used filters from All filters into the bar, two at most, never a make or model", () => {
    expect(promoted({ state: 9, keys: 3, year_max: 5, title: 50, make: 60, model: 40, damage2: 2 })).toEqual(["state", "year"]);
  });

  it("promotes nothing used fewer than three times", () => {
    expect(promoted({ state: 2 })).toEqual([]);
    expect(promoted({})).toEqual([]);
  });
});

describe("the filters", () => {
  it("put sale date, title, condition, damage and Buy now in the bar", () => {
    expect(PRIMARY).toEqual(["sale", "title", "run", "damage", "buy_now"]);
  });

  it("count every filter but the ranges", () => {
    expect(COUNTED).not.toContain("year");
    expect(COUNTED).toContain("buy_now");
    expect(paramsOf(filterById("retail"))).toEqual(["retail_min", "retail_max"]);
    expect(paramsOf(filterById("bin"))).toEqual(["bin_max"]);
  });

  it("word codes as the lot page does", () => {
    expect(valueLabel(en, filterById("run"), "unverified")).toBe("Not verified to start");
    expect(valueLabel(en, filterById("sale_type"), "approval")).toBe("Seller must approve");
    expect(valueLabel(en, filterById("vehicle_type"), "k")).toBe("Medium duty / box truck");
    expect(valueLabel(en, filterById("vehicle_type"), "Q")).toBe("Q");
    expect(valueLabel(en, filterById("source"), "copart")).toBe("Copart");
    expect(valueLabel(en, filterById("damage"), "FRONT END")).toBe("FRONT END");
    expect(valueLabel(en, filterById("drive"), "4wd")).toBe("Four-wheel drive (4WD)");
  });

  it("show amounts in their unit", () => {
    expect(amountIn("$", "15000", EN)).toBe("$15,000");
    expect(amountIn("mi", "100000", EN)).toBe("100,000 mi");
    expect(amountIn("year", "2018", EN)).toBe("2018");
  });
});

describe("chips", () => {
  it("make one removable chip per chosen value, and one per range", () => {
    const query = read(
      "q=hybrid&sale=today&title=salvage&run=starts&damage=SIDE&vehicle_type=V&buy_now=1&make=TOYOTA&model=RAV4&year_min=2018&year_max=2021&odometer_max=100000&engine=2.0L&cylinders=4&transmission=manual&drive=awd&retail_min=5000&bid_max=900&sort=sale",
    );
    expect(chips(query, EN).map((chip) => chip.label)).toEqual([
      "“hybrid”",
      "Vehicle type: Automobile",
      "TOYOTA",
      "RAV4",
      "Year 2018–2021",
      "Mileage up to 100,000 mi",
      "2.0L",
      "Cylinders: 4",
      "Manual transmission",
      "AWD",
      "Engine starts only",
      "Damage: SIDE",
      "Current bid up to $900",
      "Retail value from $5,000",
      "Sells today",
      "Salvage title",
      "Buy now available",
    ]);
  });

  it("remove only their own value, a range's bounds together, and a make's model with it", () => {
    const query = read("title=salvage&title=clean&year_min=2018&year_max=2021&make=TOYOTA&model=RAV4&sort=sale");
    const without = Object.fromEntries(chips(query, EN).map((chip) => [chip.key, queryString(chip.without)]));
    expect(without["title:salvage"]).toBe("make=TOYOTA&model=RAV4&year_min=2018&year_max=2021&title=clean&sort=sale");
    expect(without.year).toBe("make=TOYOTA&model=RAV4&title=salvage&title=clean&sort=sale");
    expect(without["make:TOYOTA"]).toBe("year_min=2018&year_max=2021&title=salvage&title=clean&sort=sale");
    expect(without["model:RAV4"]).toBe("make=TOYOTA&year_min=2018&year_max=2021&title=salvage&title=clean&sort=sale");
  });

  it("are none for an order alone", () => {
    expect(chips(read("sort=year"), EN)).toEqual([]);
  });

  it("say Future sale as Copart does", () => {
    expect(chips(read("sale=future"), EN)[0].label).toBe("Future sale");
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

describe("in Spanish", () => {
  const ES = { locale: "es", m: es } as const;

  it("words the chips and amounts in the language", () => {
    const query = { sale: ["today"], year_min: ["2018"], odometer_max: ["100000"], vehicle_type: ["K"] };
    expect(chips(query, ES).map((chip) => chip.label)).toEqual([
      `${es.filters.labels.vehicle_type}: ${es.vehicleTypes.K}`,
      `${es.filters.labels.year} ${es.filters.spanFrom.replace("{low}", "2018")}`,
      `${es.filters.labels.mileage} ${es.filters.spanUpTo.replace("{high}", "100,000 mi")}`,
      es.filters.options.sale.today.chip,
    ]);
  });
});
