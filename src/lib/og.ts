import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Assets for generated images (next/og). The renderer has no access to
 * next/font or CSS, and only reads static woff/ttf/otf fonts, so fonts and the
 * logo are read from disk. Paths are relative to the project root.
 */

export const OG_FONT_FAMILY = "Libre Franklin";

const FONT_FILES = [
  { weight: 400, file: "assets/fonts/libre-franklin-latin-400-normal.woff" },
  { weight: 800, file: "assets/fonts/libre-franklin-latin-800-normal.woff" },
] as const;

export async function loadOgFonts(root: string = process.cwd()) {
  return Promise.all(
    FONT_FILES.map(async ({ weight, file }) => ({
      name: OG_FONT_FAMILY,
      data: await readFile(join(root, file)),
      weight,
      style: "normal" as const,
    })),
  );
}

/** The light (black "Secrets") logo as a data URL, for use in an <img> inside ImageResponse. */
export async function loadLogoDataUrl(root: string = process.cwd()): Promise<string> {
  const png = await readFile(join(root, "public/brand/logo-light.png"));
  return `data:image/png;base64,${png.toString("base64")}`;
}
