// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HomePage from "@/app/[lang]/page";
import { en } from "@/messages/en";

afterEach(cleanup);

describe("home page", () => {
  it("shows the registered title as its only h1, centred", async () => {
    render(await HomePage());
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0].textContent).toBe(en.pages["/"].title);
    expect(headings[0].className).toContain("text-center");
  });
});
