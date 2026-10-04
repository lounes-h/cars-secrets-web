// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import { getRoute } from "@/lib/routes";

afterEach(cleanup);

describe("home page", () => {
  it("shows the registered title as its only h1", () => {
    render(<HomePage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe(getRoute("/").title);
  });

  it("sends every call to action to the lot list, and the hero's second link down the page", () => {
    const { container } = render(<HomePage />);
    for (const link of screen.getAllByRole("link", { name: /Explore Auctions|Try Fee Calculator/ })) {
      expect(link.getAttribute("href")).toBe("/active-lots");
    }
    expect(screen.getAllByRole("link", { name: "Explore Auctions" })).toHaveLength(2);
    const howItWorks = screen.getByRole("link", { name: /See how it works/ });
    expect(howItWorks.getAttribute("href")).toBe("#one-place");
    expect(container.querySelector("#one-place h2")?.textContent).toBe("One Place for Your Auction Search");
  });

  it("presents the four tools and the closing sections", () => {
    render(<HomePage />);
    const tools = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(tools).toEqual(["Save Your Searches", "Get Alerts", "Compare Lots Side by Side", "Calculate Auction Fees"]);
    expect(screen.getByRole("heading", { level: 2, name: "Less Searching. More Deciding." })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Start Finding Your Next Vehicle" })).toBeTruthy();
  });

  it("labels the fee figures as an example", () => {
    render(<HomePage />);
    const total = screen.getByText("Estimated total").parentElement!;
    expect(total.textContent).toBe("Estimated total$8,924");
    expect(total.closest(".card")?.textContent).toMatch(/^Example/);
  });

  it("draws sketches with names, not screenshots", () => {
    render(<HomePage />);
    expect(screen.getByRole("img", { name: /lot search/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: /comparison/ })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Auctions" }).textContent).toBe("CopartIAAManheim");
  });
});
