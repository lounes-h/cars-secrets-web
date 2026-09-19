import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOGO_SIZE } from "@/components/SiteBanner";
import manifest from "./manifest";

const root = process.cwd();
/** A PNG's width and height are big-endian uint32s at bytes 16 and 20 (the IHDR chunk). */
const size = (file: string) => {
  const png = readFileSync(join(root, file));
  return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
};

describe("brand assets", () => {
  it("has the favicon and Apple touch icon at the sizes browsers expect", () => {
    expect(size("src/app/icon.png")).toBe("192x192");
    expect(size("src/app/apple-icon.png")).toBe("180x180");
  });

  it("serves both banner logos at the size the banner declares", () => {
    for (const file of ["public/brand/logo-light.png", "public/brand/logo-dark.png"]) {
      expect(size(file), file).toBe(`${LOGO_SIZE.width}x${LOGO_SIZE.height}`);
    }
  });

  it("keeps the logo at least 112px tall, Google's minimum for an Organization logo", () => {
    expect(LOGO_SIZE.height).toBeGreaterThanOrEqual(112);
  });

  it("lists manifest icons that exist with their declared sizes", () => {
    const icons = manifest().icons ?? [];
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      const file = join("public", icon.src);
      expect(existsSync(join(root, file)), file).toBe(true);
      expect(size(file), file).toBe(icon.sizes);
    }
  });
});
