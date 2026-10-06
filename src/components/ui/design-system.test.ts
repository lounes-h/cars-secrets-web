import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

/** Every component and page, tests left out. */
const sources = (readdirSync(SRC, { recursive: true }) as string[])
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
  .map((file) => ({ file, text: readFileSync(join(SRC, file), "utf8") }));

/**
 * What would step off the system in globals.css: type, radii, weights and control heights come
 * from its scales, focus is a solid ring, and the page gutter is 16, 24 then 32px.
 */
const OFF_SYSTEM: [string, RegExp][] = [
  ["a font size off the type scale", /\btext-\[\d/],
  ["a radius off the radius scale", /\brounded(-[a-z]+)?-\[/],
  ["a weight above bold or below regular", /\bfont-(extrabold|black|light|extralight|thin)\b/],
  ["a height off the control scale", /\bh-\[\d+px\]/],
  ["a faded focus ring", /focus-visible:ring-ring\/\d/],
  ["the old 40px page gutter", /\blg:px-10\b/],
];

describe("the design system", () => {
  it("finds the sources it checks", () => {
    expect(sources.length).toBeGreaterThan(20);
  });

  it.each(OFF_SYSTEM)("has no %s", (_, pattern) => {
    expect(sources.filter(({ text }) => pattern.test(text)).map(({ file }) => file)).toEqual([]);
  });
});
