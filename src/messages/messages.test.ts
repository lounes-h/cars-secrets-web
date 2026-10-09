import { describe, expect, it } from "vitest";
import { messagesFor } from "@/messages";
import { en } from "@/messages/en";
import { es } from "@/messages/es";

/** Every key path of a dictionary and the placeholders each string holds. */
function shape(value: unknown, path = ""): Record<string, string[]> {
  if (typeof value === "string") return { [path]: [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort() };
  return Object.entries(value as object).reduce((all, [key, child]) => ({ ...all, ...shape(child, `${path}.${key}`) }), {});
}

describe("messages", () => {
  it("are found by language", () => {
    expect(messagesFor("en")).toBe(en);
    expect(messagesFor("es")).toBe(es);
  });

  it("have the same keys and the same placeholders in every language", () => {
    expect(shape(es)).toEqual(shape(en));
  });

  it.each(["en", "es"] as const)("keeps the brand name in %s", (locale) => {
    expect(messagesFor(locale).site.name).toBe("Car Bid Insight");
  });
});
