import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "@/proxy";

function request(path: string, { locale, method = "GET" }: { locale?: string; method?: string } = {}) {
  const headers = locale ? { cookie: `cs_locale=${locale}` } : undefined;
  return new NextRequest(new URL(path, "https://cars-secrets.test"), { method, headers });
}

const rewritten = (response: Response) => response.headers.get("x-middleware-rewrite");
const location = (response: Response) => response.headers.get("location");
const remembered = (response: Response) => response.headers.get("set-cookie");

describe("proxy", () => {
  it("serves an unprefixed path in English, from /en", () => {
    const response = proxy(request("/active-lots?make=TOYOTA"));
    expect(rewritten(response)).toBe("https://cars-secrets.test/en/active-lots?make=TOYOTA");
    expect(rewritten(proxy(request("/")))).toBe("https://cars-secrets.test/en");
    expect(remembered(response)).toBeNull();
  });

  it("serves a Spanish path as it is, and remembers Spanish", () => {
    const response = proxy(request("/es/active-lots"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    const cookie = remembered(response)!;
    expect(cookie).toMatch(/^cs_locale=es;/);
    expect(cookie).toMatch(/Path=\/;/);
    expect(cookie).toMatch(/Max-Age=31536000/);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(remembered(proxy(request("/es", { locale: "es" })))).toBeNull();
  });

  it("sends a visitor who chose Spanish from an English path to the Spanish one", () => {
    const response = proxy(request("/active-lots?page=2", { locale: "es" }));
    expect(response.status).toBe(307);
    expect(location(response)).toBe("https://cars-secrets.test/es/active-lots?page=2");
    expect(location(proxy(request("/", { locale: "es" })))).toBe("https://cars-secrets.test/es");
  });

  it("lets a form posted from an English page reach its action, whatever was chosen since", () => {
    expect(rewritten(proxy(request("/login", { locale: "es", method: "POST" })))).toBe("https://cars-secrets.test/en/login");
  });

  it("goes back to English from /en, remembering it, without the prefix", () => {
    const response = proxy(request("/en/active-lots?make=TOYOTA", { locale: "es" }));
    expect(location(response)).toBe("https://cars-secrets.test/active-lots?make=TOYOTA");
    expect(remembered(response)).toMatch(/^cs_locale=en;/);
    expect(location(proxy(request("/en")))).toBe("https://cars-secrets.test/");
  });

  it("ignores a remembered value that is no language", () => {
    expect(rewritten(proxy(request("/pricing", { locale: "fr" })))).toBe("https://cars-secrets.test/en/pricing");
  });

  it("runs on pages only: not Next's files, the /auth route handlers or files with an extension", () => {
    const [matcher] = config.matcher;
    const runs = (path: string) => new RegExp(`^${matcher}$`).test(path);
    expect(["/", "/active-lots", "/es/active-lots/copart/123", "/en"].every(runs)).toBe(true);
    expect(["/_next/static/x.js", "/auth/session", "/auth/callback/google", "/robots.txt", "/logo.png", "/llms.txt"].some(runs)).toBe(false);
  });
});
