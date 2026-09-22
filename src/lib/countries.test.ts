import { describe, expect, it } from "vitest";
import {
  composePhone,
  countries,
  countryFromBrowser,
  countryFromLanguages,
  flagEmoji,
  formatNational,
} from "@/lib/countries";

describe("countries", () => {
  it("lists every region with a flag, a name and its calling code, sorted by name", () => {
    const list = countries();
    expect(list.length).toBeGreaterThan(240);
    expect(list.find((c) => c.code === "FR")).toMatchObject({
      code: "FR",
      name: "France",
      flag: "🇫🇷",
      dialCode: 33,
    });
    expect(list.find((c) => c.code === "US")?.dialCode).toBe(1);
    const names = list.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
    expect(new Set(list.map((c) => c.code)).size).toBe(list.length);
  });

  it("carries an example number and the lengths it allows, for the field", () => {
    const france = countries().find((c) => c.code === "FR");
    expect(france?.example).toBe("06 12 34 56 78");
    expect(france?.lengths).toEqual([9]);
  });

  it("builds flags from the regional indicators", () => {
    expect(flagEmoji("gb")).toBe("🇬🇧");
  });
});

describe("composePhone", () => {
  it("joins the calling code and the digits", () => {
    expect(composePhone("US", "(415) 555-2671")).toBe("+14155552671");
    expect(composePhone("fr", "06 12 34 56 78")).toBe("+330612345678"); // the API drops the trunk 0
  });

  it("is null for an empty number or an unknown country", () => {
    expect(composePhone("US", "  ")).toBeNull();
    expect(composePhone("ZZ", "123")).toBeNull();
  });
});

describe("countryFromLanguages", () => {
  it("takes the first language with a known region", () => {
    expect(countryFromLanguages("fr-FR,fr;q=0.9,en-US;q=0.8")).toBe("FR");
    expect(countryFromLanguages("en,de-CH;q=0.8")).toBe("CH");
    expect(countryFromLanguages("zh-Hant-TW")).toBe("TW");
  });

  it("falls back when no region is given or known", () => {
    expect(countryFromLanguages("en")).toBe("US");
    expect(countryFromLanguages(null, "GB")).toBe("GB");
    expect(countryFromLanguages("xx-ZZ")).toBe("US");
  });
});

describe("countryFromBrowser", () => {
  it("takes the time zone's country first, because it follows where the visitor is", () => {
    expect(countryFromBrowser("Europe/Paris", ["en-US", "en"])).toBe("FR");
    expect(countryFromBrowser("America/Chicago", ["fr-FR"])).toBe("US");
  });

  it("falls back to the languages when the zone says nothing", () => {
    expect(countryFromBrowser(undefined, ["en-GB", "en"])).toBe("GB");
    expect(countryFromBrowser("Mars/Olympus", ["de-AT"])).toBe("AT");
  });

  it("answers null when the browser tells us nothing usable, so the server's guess stands", () => {
    expect(countryFromBrowser(undefined, ["en"])).toBe(null);
    expect(countryFromBrowser("UTC", [])).toBe(null);
  });
});

describe("formatNational", () => {
  it("lays the digits into the example's shape as they come", () => {
    expect(formatNational("(201) 555-0123", "2")).toBe("(2");
    expect(formatNational("(201) 555-0123", "20155")).toBe("(201) 55");
    expect(formatNational("(201) 555-0123", "2015550123")).toBe("(201) 555-0123");
    expect(formatNational("06 12 34 56 78", "0612345678")).toBe("06 12 34 56 78");
  });

  it("drops a pasted calling code instead of laying it into the national shape", () => {
    expect(formatNational("(201) 555-0123", "+1 (551) 358-8130", 1)).toBe("(551) 358-8130");
    expect(formatNational("(201) 555-0123", "001 551 358 8130", 1)).toBe("(551) 358-8130");
    expect(formatNational("(201) 555-0123", "1-551-358-8130", 1)).toBe("(551) 358-8130");
    expect(formatNational("06 12 34 56 78", "+33612345678", 33)).toBe("61 23 45 67 8");
  });

  it("keeps digits that only look like a calling code", () => {
    // A national number that still fits the example is national, "1" or not.
    expect(formatNational("(201) 555-0123", "1551358813", 1)).toBe("(155) 135-8813");
    expect(formatNational("(201) 555-0123", "(201) 555-0123", 1)).toBe("(201) 555-0123");
  });

  it("drops the separators the visitor typed, and anything past the example", () => {
    expect(formatNational("(201) 555-0123", "(201) 555-0123")).toBe("(201) 555-0123");
    expect(formatNational("(201) 555-0123", "20155501234567")).toBe("(201) 555-0123");
    expect(formatNational("(201) 555-0123", "")).toBe("");
  });
});
