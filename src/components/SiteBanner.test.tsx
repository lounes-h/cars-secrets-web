// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/app/(auth)/actions", () => ({ logoutAction: vi.fn() }));
vi.stubGlobal("fetch", vi.fn(async () => Response.json({ user: null })));

const { LOGO_SIZE, SiteBanner } = await import("@/components/SiteBanner");

afterEach(cleanup);

describe("SiteBanner", () => {
  it("renders the logo as a link home, named after the site", () => {
    render(<SiteBanner />);
    const link = screen.getByRole("link", { name: "Car's Secrets" });
    expect(link.getAttribute("href")).toBe("/");
    expect(screen.getByRole("banner").contains(link)).toBe(true);
  });

  it("loads the light logo eagerly with its intrinsic size, so it doesn't shift the layout", () => {
    render(<SiteBanner />);
    const img = screen.getByRole("img", { name: "Car's Secrets" });
    expect(img.getAttribute("src")).toBe("/brand/logo-light.png");
    expect(img.getAttribute("width")).toBe(String(LOGO_SIZE.width));
    expect(img.getAttribute("height")).toBe(String(LOGO_SIZE.height));
    expect(img.getAttribute("loading")).not.toBe("lazy");
    expect(img.getAttribute("fetchpriority")).toBe("high");
  });

  it("swaps in the dark logo only for dark color schemes", () => {
    const { container } = render(<SiteBanner />);
    const source = container.querySelector("picture > source");
    expect(source?.getAttribute("media")).toBe("(prefers-color-scheme: dark)");
    expect(source?.getAttribute("srcset")).toBe("/brand/logo-dark.png");
  });

  it("holds the account navigation", async () => {
    render(<SiteBanner />);
    const nav = screen.getByRole("navigation", { name: "Account" });
    expect(screen.getByRole("banner").contains(nav)).toBe(true);
    expect((await screen.findByRole("link", { name: "Sign in" })).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("link", { name: "Register" }).getAttribute("href")).toBe("/register");
  });

  it("spans the full width with no max-width container", () => {
    render(<SiteBanner />);
    const banner = screen.getByRole("banner");
    expect(banner.className).toContain("w-full");
    expect(banner.outerHTML).not.toMatch(/max-w-/);
  });
});
