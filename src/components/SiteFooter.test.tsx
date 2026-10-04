// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/SiteFooter";

afterEach(cleanup);

describe("SiteFooter", () => {
  it("links home with the logo, then to the pages that exist", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: "CarBidInsight" }).getAttribute("href")).toBe("/");
    const links = within(screen.getByRole("navigation", { name: "Footer" })).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/active-lots", "/how-it-works", "/pricing"]);
    expect(footer.className).toContain("w-full");
    expect(footer.outerHTML).not.toMatch(/max-w-/);
  });
});
