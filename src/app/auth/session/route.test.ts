import { beforeEach, describe, expect, it, vi } from "vitest";

const currentUser = vi.fn();
const sessionToken = vi.fn();
const unreadAlerts = vi.fn();
vi.mock("@/lib/session", () => ({ currentUser: () => currentUser(), sessionToken: () => sessionToken() }));
vi.mock("@/lib/alerts", () => ({ unreadAlerts: (token: string) => unreadAlerts(token) }));

const { GET } = await import("./route");

beforeEach(() => {
  currentUser.mockReset();
  unreadAlerts.mockReset();
  sessionToken.mockResolvedValue("sess");
  unreadAlerts.mockResolvedValue(0);
});

describe("GET /auth/session", () => {
  it("returns only the names and email of the signed-in user and how many alerts are unread, uncached", async () => {
    currentUser.mockResolvedValue({ id: "u1", email: "l@example.com", first_name: "Lounes", last_name: "H", phone: null, email_verified: true });
    unreadAlerts.mockResolvedValue(3);
    const response = await GET();
    expect(await response.json()).toEqual({ user: { first_name: "Lounes", last_name: "H", email: "l@example.com" }, unread: 3 });
    expect(unreadAlerts).toHaveBeenCalledWith("sess");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("returns no user and no count when signed out or when the API is down", async () => {
    unreadAlerts.mockResolvedValue(3);
    currentUser.mockResolvedValue(null);
    expect(await (await GET()).json()).toEqual({ user: null, unread: 0 });
    currentUser.mockRejectedValue(new Error("down"));
    expect(await (await GET()).json()).toEqual({ user: null, unread: 0 });
  });

  it("asks for no count without a session", async () => {
    sessionToken.mockResolvedValue(undefined);
    currentUser.mockResolvedValue(null);
    await GET();
    expect(unreadAlerts).not.toHaveBeenCalled();
  });
});
