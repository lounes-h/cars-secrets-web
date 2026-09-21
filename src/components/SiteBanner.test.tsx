// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/app/(auth)/actions", () => ({ logoutAction: vi.fn() }));
vi.stubGlobal("fetch", vi.fn(async () => Response.json({ user: null })));

const { SiteBanner } = await import("@/components/SiteBanner");

afterEach(cleanup);

describe("SiteBanner", () => {
  it("renders the site name as a link home, and no logo image", () => {
    const { container } = render(<SiteBanner />);
    const link = screen.getByRole("link", { name: "CarBidWise" });
    expect(link.getAttribute("href")).toBe("/");
    expect(screen.getByRole("banner").contains(link)).toBe(true);
    expect(container.querySelector("img, picture, svg")).toBe(null);
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
