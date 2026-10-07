// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  fill,
  formatCount,
  isLocale,
  LOCALE_LIST,
  LOCALES,
  localePath,
  lookup,
  plural,
  pluralForm,
  rich,
  splitLocale,
} from "@/lib/i18n";

describe("locales", () => {
  it("are English, the default, and Spanish, each named in itself", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(LOCALE_LIST).toEqual(["en", "es"]);
    expect(LOCALES.en.label).toBe("English (United States)");
    expect(LOCALES.es.label).toBe("Español (Estados Unidos)");
  });

  it("knows only its own languages, never one of Object's keys", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("toString")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("localePath", () => {
  it("keeps English paths and prefixes the others", () => {
    expect(localePath("/active-lots?make=TOYOTA", "en")).toBe("/active-lots?make=TOYOTA");
    expect(localePath("/active-lots?make=TOYOTA", "es")).toBe("/es/active-lots?make=TOYOTA");
    expect(localePath("/", "es")).toBe("/es");
  });
});

describe("splitLocale", () => {
  it("reads the language off the prefix, English without one", () => {
    expect(splitLocale("/es/active-lots/copart/1")).toEqual({ locale: "es", path: "/active-lots/copart/1" });
    expect(splitLocale("/es")).toEqual({ locale: "es", path: "/" });
    expect(splitLocale("/en/login")).toEqual({ locale: "en", path: "/login" });
    expect(splitLocale("/login")).toEqual({ locale: "en", path: "/login" });
    expect(splitLocale("/estimates")).toEqual({ locale: "en", path: "/estimates" });
  });
});

describe("fill and rich", () => {
  it("puts values in their places and leaves unknown names as written", () => {
    expect(fill("{count} lots, page {page}", { count: "3", page: 2 })).toBe("3 lots, page 2");
    expect(fill("Hello {name}", {})).toBe("Hello {name}");
  });

  it("puts elements in their places", () => {
    const { container } = render(<p>{rich("Sent to {email}. {link}", { email: <strong>a@b.co</strong>, link: <em>Again</em> })}</p>);
    expect(container.innerHTML).toBe("<p>Sent to <strong>a@b.co</strong>. <em>Again</em></p>");
  });
});

describe("plural", () => {
  const lots = { one: "{count} lot", other: "{count} lots" };

  it("chooses the language's form and groups the number", () => {
    expect(plural("en", lots, 1)).toBe("1 lot");
    expect(plural("en", lots, 0)).toBe("0 lots");
    expect(plural("en", lots, 11821)).toBe("11,821 lots");
    expect(plural("es", { one: "{count} lote", other: "{count} lotes" }, 1)).toBe("1 lote");
    // Spanish's "many" (a million) reads as "other".
    expect(pluralForm("es", { one: "uno", other: "otros" }, 1_000_000)).toBe("otros");
  });

  it("formats counts as each language groups them", () => {
    expect(formatCount("en", 1234)).toBe("1,234");
    expect(formatCount("es", 1234)).toBe("1,234");
  });
});

describe("lookup", () => {
  it("finds a dynamic key's words, and never one of Object's own", () => {
    const map = { invalid_state: "Expired." };
    expect(lookup(map, "invalid_state")).toBe("Expired.");
    expect(lookup(map, "toString")).toBeUndefined();
    expect(lookup(map, "missing")).toBeUndefined();
  });
});
