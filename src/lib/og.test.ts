import { describe, expect, it } from "vitest";
import { loadLogoDataUrl, loadOgFonts, OG_FONT_FAMILY } from "@/lib/og";

describe("loadOgFonts", () => {
  it("loads regular and extra-bold Libre Franklin as woff", async () => {
    const fonts = await loadOgFonts();
    expect(fonts.map((font) => [font.name, font.weight, font.style])).toEqual([
      [OG_FONT_FAMILY, 400, "normal"],
      [OG_FONT_FAMILY, 800, "normal"],
    ]);
    for (const font of fonts) {
      // woff files start with the "wOFF" signature; next/og cannot read woff2.
      expect(font.data.subarray(0, 4).toString("latin1")).toBe("wOFF");
    }
  });

  it("fails when a font file is missing", async () => {
    await expect(loadOgFonts("/nonexistent")).rejects.toThrow();
  });
});

describe("loadLogoDataUrl", () => {
  it("returns the light logo as a PNG data URL", async () => {
    const url = await loadLogoDataUrl();
    expect(url.startsWith("data:image/png;base64,")).toBe(true);
    const png = Buffer.from(url.slice("data:image/png;base64,".length), "base64");
    expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
  });
});
