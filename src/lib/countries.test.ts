import { describe, expect, it } from "vitest";
import { composePhone, countries, countryFromLanguages, flagEmoji } from "@/lib/countries";

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
