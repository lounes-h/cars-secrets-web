// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { DealCalculator } from "@/components/DealCalculator";

afterEach(cleanup);

const row = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

it("adds up the sample deal at the default max bid", () => {
  render(<DealCalculator />);
  expect(screen.getByLabelText("Your max bid: $1,900")).toBeTruthy();
  expect(row("Total cost")).toBe("$6,550");
  expect(row("Est. profit")).toBe("+$650");
  expect(screen.getByText("Max bid for $1,000 profit: $1,550")).toBeTruthy();
  expect(screen.getByText(/^Calculator costs and profit use sample figures/)).toBeTruthy();
});

it("recomputes as the max bid slides, down to a loss", () => {
  render(<DealCalculator />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "3000" } });
  expect(screen.getByLabelText("Your max bid: $3,000")).toBeTruthy();
  expect(row("Total cost")).toBe("$7,650");
  expect(row("Est. profit")).toBe("−$450");
  expect(screen.getByText("Max bid for $1,000 profit: $1,550")).toBeTruthy(); // does not depend on the bid
});
