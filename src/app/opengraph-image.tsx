import { ImageResponse } from "next/og";
import { analyzeDeal, exampleDeal, formatUsd } from "@/lib/deal";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/metadata";
import { site } from "@/lib/site";

export const alt = DEFAULT_OG_IMAGE.alt;
export const size = { width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#1d2a33",
          color: "#e6ecef",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700 }}>{site.name}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 34, color: "#9aa7b1" }}>Suggested max bid</div>
          <div style={{ fontSize: 150, fontWeight: 900, color: "#f2c230", transform: "rotate(-2deg)" }}>{formatUsd(analyzeDeal(exampleDeal).suggestedMaxBid)}</div>
        </div>
        <div style={{ fontSize: 38, maxWidth: 1000 }}>Know your max bid before the auction starts.</div>
      </div>
    ),
    size,
  );
}
