// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lang } from "next/root-params";

const { currentUser, getAlertSettings, visitorZone } = vi.hoisted(() => ({
  currentUser: vi.fn(),
  getAlertSettings: vi.fn(),
  visitorZone: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ currentUser, visitorZone, sessionToken: async () => "token-abc", visitorIp: async () => "9.9.9.9" }));
vi.mock("@/lib/alerts", async (original) => ({ ...(await original<object>()), getAlertSettings }));
vi.mock("@/app/[lang]/settings/actions", () => ({ saveAlertSettingsAction: vi.fn() }));

const { default: SettingsPage, generateMetadata } = await import("@/app/[lang]/settings/page");

const UNSET = { email_matches: true, email_changes: true, email_reminders: true, twice_daily: false, time_zone: null, locale: null };

beforeEach(() => {
  currentUser.mockResolvedValue({ id: "u1", email: "dealer@example.com" });
  getAlertSettings.mockResolvedValue(UNSET);
  visitorZone.mockResolvedValue("America/Denver");
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const zone = () => screen.getByRole("combobox", { name: "Time zone" }) as HTMLSelectElement;
const checked = (name: string) => screen.getByRole("radio", { name }).getAttribute("aria-checked");

describe("Settings page", () => {
  it("is titled from its registered words", async () => {
    expect((await generateMetadata()).title).toEqual({ absolute: "Settings" });
  });

  it("asks a visitor to sign in", async () => {
    currentUser.mockResolvedValue(null);
    render(await SettingsPage());
    expect(screen.getByRole("link", { name: "Sign in to change your settings" }).getAttribute("href")).toBe("/login");
    expect(getAlertSettings).not.toHaveBeenCalled();
  });

  it("offers the email alerts, starting from the page's language and the browser's zone until they are chosen", async () => {
    render(await SettingsPage());
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Settings");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Email alerts");
    expect(zone().value).toBe("America/Denver");
    expect(checked("English (United States)")).toBe("true");
  });

  it("shows the chosen ones, a zone the list lacks included", async () => {
    getAlertSettings.mockResolvedValue({ ...UNSET, time_zone: "UTC", locale: "es", twice_daily: true });
    vi.mocked(lang).mockResolvedValueOnce("en");
    render(await SettingsPage());
    expect(zone().value).toBe("UTC");
    expect(checked("Español (Estados Unidos)")).toBe("true");
    expect(checked("Twice a day, at 7 AM and 5 PM")).toBe("true");
  });

  it("falls back to UTC without a zone from the browser", async () => {
    visitorZone.mockResolvedValue(null);
    render(await SettingsPage());
    expect(zone().value).toBe("UTC");
  });
});
