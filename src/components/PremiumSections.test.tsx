// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { DamageMap, DamageReport, Market, PremiumSummary } from "@/components/PremiumSections";
import { range } from "@/lib/premium-sample";
import { en } from "@/messages/en";

const i18n = { locale: "en", m: en } as const;

afterEach(cleanup);

it("writes cost ranges as the damage report does", () => {
  expect(range("en", [1400, 2100])).toBe("$1,400 – 2,100");
  expect(range("en", [500, 700], true)).toBe("$500 – 700+");
});

it("summarises the sample lot and who it suits", () => {
  render(<PremiumSummary i18n={i18n} />);
  const summary = screen.getByRole("region", { name: "Summary" });
  expect(summary.textContent).toContain("High-mileage GT hit front and rear.");
  expect(summary.textContent).toContain("Best for: DIY rebuild or parts");
});

it("numbers each damaged area on the map, with a legend in words", () => {
  render(<DamageMap m={en} />);
  expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Damage map: 1 front left, 2 rear right");
  expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    "1 Front left, severe · bumper, headlight, fender",
    "2 Rear right, moderate · bumper cover, quarter panel",
  ]);
  expect(screen.getByText(/^Sample figures/)).toBeTruthy();
});

it("lists each damaged area with its estimate, and adds them up", () => {
  render(<DamageReport i18n={i18n} />);
  const report = screen.getByRole("region", { name: "Damage report" });
  expect(report.textContent).toContain("Insurer repair estimate$9,117");
  const rows = within(report).getAllByRole("row").map((row) => Array.from(row.children, (cell) => cell.textContent));
  expect(rows).toEqual([
    ["Area", "What we see", "Severity", "Our estimate"],
    ["1 Front left", "Bumper, headlight, fender", "Severe", "$1,400 – 2,100"],
    ["2 Rear right", "Bumper cover, quarter panel", "Moderate", "$900 – 1,400"],
    ["Drivetrain", "Starts, does not drive", "Unknown", "$500 – 700+"],
    ["Total", "used parts", "", "$2,800 – 4,200"],
  ]);
});

it("shows the market's value and how the lot sells", () => {
  render(<Market i18n={i18n} />);
  const market = screen.getByRole("region", { name: "Market" }).textContent;
  expect(market).toContain("Copart ACV$7,076");
  expect(market).toContain("Resale with salvage title$7,200");
  expect(market).toContain("Avg. time to sell24 days");
  expect(market).toContain("Similar lots sold (90 days)31");
});
