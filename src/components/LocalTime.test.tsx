import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { LocalTime } from "@/components/LocalTime";
import { es } from "@/messages/es";

const zone = process.env.TZ;
afterEach(() => {
  process.env.TZ = zone;
});

/** The page's HTML, and what its inline script writes into the `<time>` in a browser's zone. */
function page(value: string | null, format?: "full" | "sale") {
  const html = renderToStaticMarkup(<LocalTime value={value} format={format} />);
  const script = html.match(/<script[^>]*>(.*)<\/script>/)?.[1] ?? "";
  const time = { textContent: "" };
  const inBrowser = (browserZone: string) => {
    process.env.TZ = browserZone;
    new Function("document", script)({ getElementById: () => time });
    return time.textContent;
  };
  return { html, inBrowser };
}

describe("LocalTime", () => {
  it("writes the moment in the server's zone, marked up with the exact instant", () => {
    process.env.TZ = "America/Chicago";
    const { html } = page("2026-09-24T16:00:00Z");
    expect(html).toContain('dateTime="2026-09-24T16:00:00Z"');
    expect(html).toContain(">Sep 24, 2026, 11:00 AM CDT</time>");
  });

  it("rewrites it in the browser's own zone before the page is painted", () => {
    process.env.TZ = "UTC";
    const { inBrowser } = page("2026-09-24T16:00:00Z", "sale");
    expect(inBrowser("America/Los_Angeles")).toBe("Thu, Sep 24, 9:00 AM PDT");
    expect(inBrowser("Asia/Tokyo")).toBe("Fri, Sep 25, 1:00 AM GMT+9"); // the next day there
  });

  it("reads an offset the API sends instead of Z", () => {
    const { inBrowser } = page("2026-09-24T11:00:00-05:00");
    expect(inBrowser("UTC")).toBe("Sep 24, 2026, 4:00 PM UTC");
  });

  it("keeps the API's string out of the script", () => {
    const { html } = page("2026-09-24T16:00:00Z");
    expect(html).toMatch(/\.format\(1790265600000\)<\/script>/);
  });

  it("shows a dash when there is no time", () => {
    expect(page(null).html).toBe("—");
  });
});

describe("LocalTime in Spanish", () => {
  it("writes the moment as US Spanish does, in the server's zone and then the browser's", () => {
    process.env.TZ = "America/Chicago";
    const html = renderToStaticMarkup(
      <I18nProvider value={{ locale: "es", m: es }}>
        <LocalTime value="2026-09-18T19:00:00Z" format="sale" />
      </I18nProvider>,
    );
    expect(html).toContain(">vie, 18 de sept, 2:00 p.m. CDT</time>");
    expect(html).toContain('new Intl.DateTimeFormat("es-US"');
  });
});
