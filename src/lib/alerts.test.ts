import { afterEach, describe, expect, it, vi } from "vitest";

const api = vi.fn<(path: string, options: unknown) => Promise<unknown>>();
vi.mock("@/lib/api", async (original) => ({ ...(await original<object>()), api }));

const { ApiError } = await import("@/lib/api");
const { getAlerts, getAlertSettings, isAlertKind, markAlertsRead, saveAlertSettings, unreadAlerts } = await import("@/lib/alerts");

afterEach(() => api.mockReset());

describe("alerts", () => {
  it("asks for a page of 20, of one kind or of all", async () => {
    api.mockResolvedValue({ items: [], total: 0, unread: 0 });
    await getAlerts("reminder", 3, "tok", "9.9.9.9");
    expect(api).toHaveBeenLastCalledWith("/api/me/alerts?limit=20&offset=40&kind=reminder", { token: "tok", clientIp: "9.9.9.9" });
    await getAlerts(null, 1, "tok");
    expect(api).toHaveBeenLastCalledWith("/api/me/alerts?limit=20&offset=0", { token: "tok", clientIp: null });
  });

  it("knows its kinds", () => {
    expect(["matches", "changes", "reminder", "other", undefined].map(isAlertKind)).toEqual([true, true, true, false, false]);
  });

  it("counts the unread ones, and none when the API cannot say", async () => {
    api.mockResolvedValue({ unread: 4 });
    expect(await unreadAlerts("tok")).toBe(4);
    expect(api).toHaveBeenLastCalledWith("/api/me/alerts/unread", { token: "tok", clientIp: null });
    api.mockRejectedValue(new ApiError(401, "not_authenticated", "Sign in"));
    expect(await unreadAlerts("tok")).toBe(0);
  });

  it("marks some or all of them read", async () => {
    api.mockResolvedValue({ unread: 2 });
    expect(await markAlertsRead([7, 9], "tok")).toBe(2);
    expect(api).toHaveBeenLastCalledWith("/api/me/alerts/read", { method: "POST", body: { ids: [7, 9] }, token: "tok", clientIp: null });
    await markAlertsRead(null, "tok", "9.9.9.9");
    expect(api).toHaveBeenLastCalledWith("/api/me/alerts/read", { method: "POST", body: {}, token: "tok", clientIp: "9.9.9.9" });
  });
});

describe("alert settings", () => {
  it("reads and keeps them", async () => {
    const settings = {
      email_matches: true,
      email_changes: false,
      email_reminders: true,
      twice_daily: true,
      time_zone: "America/Chicago",
      locale: "es" as const,
    };
    api.mockResolvedValue(settings);
    expect(await getAlertSettings("tok")).toEqual(settings);
    expect(api).toHaveBeenLastCalledWith("/api/me/alert-settings", { token: "tok", clientIp: null });
    await saveAlertSettings(settings, "tok", "9.9.9.9");
    expect(api).toHaveBeenLastCalledWith("/api/me/alert-settings", { method: "PUT", body: settings, token: "tok", clientIp: "9.9.9.9" });
  });
});
