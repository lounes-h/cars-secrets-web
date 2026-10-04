// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/app/(auth)/actions", () => ({ logoutAction: vi.fn() }));
vi.stubGlobal("fetch", vi.fn(async () => Response.json({ user: null })));

const { SiteBanner } = await import("@/components/SiteBanner");

afterEach(cleanup);

describe("SiteBanner", () => {
  it("links home with the CarBidInsight logo", () => {
    render(<SiteBanner />);
    const link = screen.getByRole("link", { name: "CarBidInsight" });
    const logo = screen.getByRole("img", { name: "CarBidInsight" });
    expect(link.getAttribute("href")).toBe("/");
    expect(screen.getByRole("banner").contains(link)).toBe(true);
    expect(link.contains(logo)).toBe(true);
    expect(logo.getAttribute("width")).toBe("192");
    expect(logo.getAttribute("height")).toBe("32");
    expect(logo.getAttribute("src")).toBe("/logo.png");
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
