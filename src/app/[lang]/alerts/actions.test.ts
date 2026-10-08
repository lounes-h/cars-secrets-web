import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { markAlertsRead, sessionToken, refresh } = vi.hoisted(() => ({
  markAlertsRead: vi.fn(),
  sessionToken: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/lib/alerts", async (original) => ({ ...(await original<object>()), markAlertsRead }));
vi.mock("@/lib/session", () => ({ sessionToken, visitorIp: async () => "9.9.9.9" }));
vi.mock("next/cache", () => ({ refresh }));

const { markAlertReadAction, markAllAlertsReadAction } = await import("./actions");

beforeEach(() => sessionToken.mockResolvedValue("sess"));
afterEach(() => vi.clearAllMocks());

describe("markAlertReadAction", () => {
  it("marks one alert read", async () => {
    await markAlertReadAction(7);
    expect(markAlertsRead).toHaveBeenCalledWith([7], "sess", "9.9.9.9");
  });

  it("asks nothing without a session or an alert id, and shrugs off a failure", async () => {
    sessionToken.mockResolvedValueOnce(undefined);
    await markAlertReadAction(7);
    for (const id of [0, -3, 1.5, "7", Number.MAX_VALUE]) await markAlertReadAction(id as number);
    expect(markAlertsRead).not.toHaveBeenCalled();
    markAlertsRead.mockRejectedValueOnce(new Error("down"));
    await expect(markAlertReadAction(7)).resolves.toBeUndefined();
  });
});

describe("markAllAlertsReadAction", () => {
  it("marks every alert read and shows the page again", async () => {
    await markAllAlertsReadAction();
    expect(markAlertsRead).toHaveBeenCalledWith(null, "sess", "9.9.9.9");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the page as it is when the API failed, and does nothing without a session", async () => {
    markAlertsRead.mockRejectedValueOnce(new Error("down"));
    await markAllAlertsReadAction();
    expect(refresh).toHaveBeenCalledTimes(1);
    sessionToken.mockResolvedValueOnce(undefined);
    await markAllAlertsReadAction();
    expect(markAlertsRead).toHaveBeenCalledTimes(1);
  });
});
