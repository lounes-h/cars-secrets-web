// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { saveAlertSettingsAction } = vi.hoisted(() => ({ saveAlertSettingsAction: vi.fn() }));
vi.mock("@/app/[lang]/settings/actions", () => ({ saveAlertSettingsAction }));

const { AlertSettingsForm } = await import("@/components/AlertSettingsForm");

const SETTINGS = {
  email_matches: true,
  email_changes: false,
  email_reminders: true,
  twice_daily: false,
  time_zone: "America/Chicago",
  locale: "en" as const,
};
const ZONES = ["America/Chicago", "America/Los_Angeles", "America/New_York"];

const click = (element: HTMLElement) => act(async () => fireEvent.click(element));
const checked = (element: HTMLElement) => element.getAttribute("aria-checked");

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("alert settings", () => {
  it("show the dealer's choices", () => {
    render(<AlertSettingsForm initial={SETTINGS} zones={ZONES} />);
    expect(checked(screen.getByRole("checkbox", { name: "New lots matching my saved searches" }))).toBe("true");
    expect(checked(screen.getByRole("checkbox", { name: "Changes to my saved lots" }))).toBe("false");
    expect(checked(screen.getByRole("checkbox", { name: "My auction reminders" }))).toBe("true");
    expect(checked(screen.getByRole("radio", { name: "Once a day, at 7 AM" }))).toBe("true");
    expect(checked(screen.getByRole("radio", { name: "English (United States)" }))).toBe("true");
    const zone = screen.getByRole("combobox", { name: "Time zone" }) as HTMLSelectElement;
    expect(zone.value).toBe("America/Chicago");
    expect([...zone.options].map((option) => option.textContent)).toEqual(["America/Chicago", "America/Los Angeles", "America/New York"]);
  });

  it("keep what the dealer changes, and say so", async () => {
    saveAlertSettingsAction.mockResolvedValue({ value: SETTINGS });
    render(<AlertSettingsForm initial={SETTINGS} zones={ZONES} />);

    await click(screen.getByRole("checkbox", { name: "Changes to my saved lots" }));
    await click(screen.getByRole("radio", { name: "Twice a day, at 7 AM and 5 PM" }));
    await click(screen.getByRole("radio", { name: "Español (Estados Unidos)" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Time zone" }), { target: { value: "America/New_York" } });
    await click(screen.getByRole("button", { name: "Save settings" }));

    expect(saveAlertSettingsAction).toHaveBeenCalledWith({
      email_matches: true,
      email_changes: true,
      email_reminders: true,
      twice_daily: true,
      time_zone: "America/New_York",
      locale: "es",
    });
    expect(screen.getByRole("status").textContent).toBe("Settings saved.");
  });

  it("say why they could not be kept", async () => {
    saveAlertSettingsAction.mockResolvedValue({ error: "That did not work. Please try again." });
    render(<AlertSettingsForm initial={SETTINGS} zones={ZONES} />);

    await click(screen.getByRole("button", { name: "Save settings" }));

    expect(screen.getByRole("alert").textContent).toBe("That did not work. Please try again.");
  });
});
