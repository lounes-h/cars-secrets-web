// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage, { metadata } from "@/app/page";

afterEach(cleanup);

describe("home page", () => {
  it("has one h1 whose lede answers what the product is for", () => {
    render(<HomePage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe("Find the lots worth buying.");
    expect(
      screen.getByText(/searches multiple vehicle auctions and shows what a lot is really worth/),
    ).toBeTruthy();
  });

  it("sends visitors to register and to sign in", () => {
    render(<HomePage />);
    for (const link of screen.getAllByRole("link", { name: "Create your account" })) {
      expect(link.getAttribute("href")).toBe("/register");
    }
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/login");
  });

  it("presents the analysis as analysis, not as a promise", () => {
    render(<HomePage />);
    expect(screen.getByText(/A plain-English read on every lot, and a score to sort by\./)).toBeTruthy();
    expect(screen.getByText(/Analysis, never a promise\./)).toBeTruthy();
  });

  it("says the platform does not take bids", () => {
    render(<HomePage />);
    expect(screen.getByText(/every lot links back to the auction that runs it/i)).toBeTruthy();
  });

  it("shows the worked example with the figures analyzeDeal produces", () => {
    render(<HomePage />);
    const analysis = screen.getByText("Deal analysis").closest("section");
    expect(analysis).not.toBeNull();
    const deal = within(analysis as HTMLElement);
    // Purchase price is the suggested max bid, not the current bid.
    expect(deal.getAllByText("$9,400").length).toBeGreaterThan(0);
    expect(deal.getByText("$13,270")).toBeTruthy();
    expect(deal.getByText("$5,630")).toBeTruthy();
    expect(deal.getByText("29.8% margin")).toBeTruthy();
  });

  it("labels the example as an example and the figures as estimates", () => {
    render(<HomePage />);
    expect(screen.getByText("Example")).toBeTruthy();
    expect(screen.getByText(/Illustrative figures for one example lot/)).toBeTruthy();
    expect(screen.getByText(/is an estimate, not a guarantee/)).toBeTruthy();
  });

  it("is indexable and canonical at the site root", () => {
    expect(metadata.alternates?.canonical).toBe("https://cars-secrets.test/");
    expect(metadata.robots).toMatchObject({ index: true });
    expect(metadata.title).toEqual({ absolute: "Car's Secrets: find the lots worth buying" });
  });
});
