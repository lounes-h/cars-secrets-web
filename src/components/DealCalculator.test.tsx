// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { DealCalculator } from "@/components/DealCalculator";

afterEach(cleanup);

const row = (label: string) => screen.getByText(label).nextElementSibling?.textContent;
// The slider's range input sits in a thumb that stays hidden until the browser has measured it,
// which jsdom never does: found by its role, its label checked by its words.
const slider = (label: string) => {
  const input = screen.getByRole("slider", { hidden: true });
  expect(document.getElementById(input.getAttribute("aria-labelledby")!)?.textContent).toBe(label);
  return input;
};

it("adds up the sample deal at the default max bid", () => {
  render(<DealCalculator />);
  expect(slider("Your max bid: $1,900")).toBeTruthy();
  expect(row("Total cost")).toBe("$6,550");
  expect(row("Est. profit")).toBe("+$650");
  expect(screen.getByText("Max bid for $1,000 profit: $1,550")).toBeTruthy();
  expect(screen.getByText(/^Calculator costs and profit use sample figures/)).toBeTruthy();
});

it("recomputes as the max bid slides, down to a loss", () => {
  render(<DealCalculator />);
  fireEvent.change(slider("Your max bid: $1,900"), { target: { value: "3000" } });
  expect(slider("Your max bid: $3,000")).toBeTruthy();
  expect(row("Total cost")).toBe("$7,650");
  expect(row("Est. profit")).toBe("−$450");
  expect(screen.getByText("Max bid for $1,000 profit: $1,550")).toBeTruthy(); // does not depend on the bid
});
