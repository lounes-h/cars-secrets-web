import { ImageResponse } from "next/og";
import { LOGO_SIZE } from "@/components/SiteBanner";
import { loadLogoDataUrl, loadOgFonts, OG_FONT_FAMILY } from "@/lib/og";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/metadata";
import { site } from "@/lib/site";

export const alt = DEFAULT_OG_IMAGE.alt;
export const size = { width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height };
export const contentType = "image/png";

const LOGO_WIDTH = 320;

export default async function OpengraphImage() {
  const [fonts, logo] = await Promise.all([loadOgFonts(), loadLogoDataUrl()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: site.colors.white,
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", padding: "88px 88px 0" }}>
          <img
            src={logo}
            alt=""
            width={LOGO_WIDTH}
            height={Math.round((LOGO_WIDTH * LOGO_SIZE.height) / LOGO_SIZE.width)}
          />
          <div
            style={{
              marginTop: 64,
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: site.colors.ink,
            }}
          >
            {site.tagline}
          </div>
          <div style={{ marginTop: 20, fontSize: 32, fontWeight: 400, color: site.colors.muted, maxWidth: 960 }}>
            Copart, IAA and Manheim listings in one search, with the resale value, total cost, profit and max bid
            for every lot.
          </div>
        </div>
        <div style={{ height: 20, background: site.colors.teal }} />
      </div>
    ),
    { ...size, fonts },
  );
}
