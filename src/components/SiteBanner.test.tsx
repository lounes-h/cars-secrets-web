// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/app/(auth)/actions", () => ({ logoutAction: vi.fn() }));
vi.stubGlobal("fetch", vi.fn(async () => Response.json({ user: null })));

const { LOGO_SIZE, MARK_SIZE, SiteBanner } = await import("@/components/SiteBanner");

afterEach(cleanup);

describe("SiteBanner", () => {
  it("renders the logo as a link home, named after the site", () => {
    render(<SiteBanner />);
    const link = screen.getByRole("link", { name: "CarBidWise" });
    expect(link.getAttribute("href")).toBe("/");
    expect(screen.getByRole("banner").contains(link)).toBe(true);
  });

  it("falls back to the light mark eagerly with its intrinsic size, so it doesn't shift the layout", () => {
    render(<SiteBanner />);
    const img = screen.getByRole("img", { name: "CarBidWise" });
    expect(img.getAttribute("src")).toBe("/brand/mark-light.png");
    expect(img.getAttribute("width")).toBe(String(MARK_SIZE.width));
    expect(img.getAttribute("height")).toBe(String(MARK_SIZE.height));
    expect(img.getAttribute("loading")).not.toBe("lazy");
    expect(img.getAttribute("fetchpriority")).toBe("high");
  });

  it("serves the wordmark from 640px and the mark below it, in both colour schemes", () => {
    const { container } = render(<SiteBanner />);
    const sources = [...container.querySelectorAll("picture > source")].map((source) => [
      source.getAttribute("media"),
      source.getAttribute("srcset"),
    ]);
    expect(sources).toEqual([
      ["(min-width: 640px) and (prefers-color-scheme: dark)", "/brand/logo-dark.png"],
      ["(min-width: 640px)", "/brand/logo-light.png"],
      ["(prefers-color-scheme: dark)", "/brand/mark-dark.png"],
    ]);
    const wordmark = container.querySelector("picture > source");
    expect(wordmark?.getAttribute("width")).toBe(String(LOGO_SIZE.width));
    expect(wordmark?.getAttribute("height")).toBe(String(LOGO_SIZE.height));
  });

  it("holds the account navigation", async () => {
    render(<SiteBanner />);
    const nav = screen.getByRole("navigation", { name: "Account" });
    expect(screen.getByRole("banner").contains(nav)).toBe(true);
    expect((await screen.findByRole("link", { name: "Sign in" })).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("link", { name: /7 days free trial/ }).getAttribute("href")).toBe("/register");
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
  });

  it("spans the full width with no max-width container", () => {
    render(<SiteBanner />);
    const banner = screen.getByRole("banner");
    expect(banner.className).toContain("w-full");
    expect(banner.outerHTML).not.toMatch(/max-w-/);
  });
});
