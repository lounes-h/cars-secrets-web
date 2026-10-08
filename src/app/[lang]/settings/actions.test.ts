import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "@/messages/en";
import { es } from "@/messages/es";

const { saveAlertSettings, sessionToken, cookieGet } = vi.hoisted(() => ({
  saveAlertSettings: vi.fn(),
  sessionToken: vi.fn(),
  cookieGet: vi.fn<(name: string) => { value: string } | undefined>(),
}));
vi.mock("@/lib/alerts", async (original) => ({ ...(await original<object>()), saveAlertSettings }));
vi.mock("@/lib/session", () => ({ sessionToken, visitorIp: async () => "9.9.9.9" }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));

const { saveAlertSettingsAction } = await import("./actions");

const CHOSEN = {
  email_matches: true,
  email_changes: false,
  email_reminders: true,
  twice_daily: true,
  time_zone: "America/Chicago",
  locale: "es" as const,
};

beforeEach(() => {
  sessionToken.mockResolvedValue("sess");
  cookieGet.mockReturnValue(undefined);
});
afterEach(() => vi.clearAllMocks());

describe("saveAlertSettingsAction", () => {
  it("keeps the dealer's choices", async () => {
    saveAlertSettings.mockResolvedValue(CHOSEN);
    expect(await saveAlertSettingsAction({ ...CHOSEN, evil: 1 } as never)).toEqual({ value: CHOSEN });
    expect(saveAlertSettings).toHaveBeenCalledWith(CHOSEN, "sess", "9.9.9.9");
  });

  it("refuses a choice that is not one, without asking the API", async () => {
    for (const change of [{ email_matches: "yes" }, { twice_daily: undefined }, { time_zone: "Mars/Olympus" }, { locale: "fr" }]) {
      expect(await saveAlertSettingsAction({ ...CHOSEN, ...change } as never)).toEqual({ error: en.settings.failed });
    }
    expect(await saveAlertSettingsAction(null as never)).toEqual({ error: en.settings.failed });
    expect(saveAlertSettings).not.toHaveBeenCalled();
  });

  it("says so, in the page's language, when the API or the session failed", async () => {
    cookieGet.mockReturnValue({ value: "es" });
    saveAlertSettings.mockRejectedValueOnce(new Error("down"));
    expect(await saveAlertSettingsAction(CHOSEN)).toEqual({ error: es.settings.failed });
    sessionToken.mockResolvedValueOnce(undefined);
    expect(await saveAlertSettingsAction(CHOSEN)).toEqual({ error: es.settings.failed });
    expect(saveAlertSettings).toHaveBeenCalledTimes(1);
  });
});
