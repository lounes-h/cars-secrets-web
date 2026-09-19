import { ImageResponse } from "next/og";

export const dynamic = "force-static";

/** Raster logo for structured data and the web manifest; search engines don't accept SVG logos. */
export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#17222b", borderRadius: 96 }}>
        <svg viewBox="0 0 64 64" width="512" height="512">
          <path d="M14 44 L30 20 L50 20" fill="none" stroke="#f2c230" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="18" cy="20" r="4.5" fill="#f2c230" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
