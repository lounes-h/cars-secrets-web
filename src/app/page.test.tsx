// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import { getRoute } from "@/lib/routes";

afterEach(cleanup);

describe("home page", () => {
  it("shows the registered title as its only h1, centred", () => {
    render(<HomePage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe(getRoute("/").title);
    expect(headings[0].className).toContain("text-center");
  });
});
