// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { en } from "@/messages/en";
import { es } from "@/messages/es";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/app/[lang]/(auth)/actions", () => ({ logoutAction: vi.fn() }));
vi.stubGlobal("fetch", vi.fn(async () => Response.json({ user: null })));

const { SiteBanner } = await import("@/components/SiteBanner");

afterEach(cleanup);

describe("SiteBanner", () => {
  it("links home with the Car Bid Insight logo", () => {
    render(<SiteBanner i18n={{ locale: "en", m: en }} />);
    const link = screen.getByRole("link", { name: "Car Bid Insight" });
    const logo = screen.getByRole("img", { name: "Car Bid Insight" });
    expect(link.getAttribute("href")).toBe("/");
    expect(screen.getByRole("banner").contains(link)).toBe(true);
    expect(link.contains(logo)).toBe(true);
    expect(logo.getAttribute("width")).toBe("192");
    expect(logo.getAttribute("height")).toBe("32");
    expect(logo.getAttribute("src")).toBe("/logo.png");
  });

  it("holds the account navigation", async () => {
    render(<SiteBanner i18n={{ locale: "en", m: en }} />);
    const nav = screen.getByRole("navigation", { name: "Account" });
    expect(screen.getByRole("banner").contains(nav)).toBe(true);
    expect((await screen.findByRole("link", { name: "Sign in" })).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("link", { name: /7 days free trial/ }).getAttribute("href")).toBe("/register");
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
  });

  it("links a Spanish page's logo to the Spanish home", () => {
    render(<SiteBanner i18n={{ locale: "es", m: es }} />);
    expect(screen.getByRole("link", { name: "Car Bid Insight" }).getAttribute("href")).toBe("/es");
  });

  it("spans the full width with no max-width container", () => {
    render(<SiteBanner i18n={{ locale: "en", m: en }} />);
    const banner = screen.getByRole("banner");
    expect(banner.className).toContain("w-full");
    expect(banner.outerHTML).not.toMatch(/max-w-/);
  });
});
