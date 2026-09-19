import { beforeEach, describe, expect, it, vi } from "vitest";

const currentUser = vi.fn();
vi.mock("@/lib/session", () => ({ currentUser: () => currentUser() }));

const { GET } = await import("./route");

beforeEach(() => {
  currentUser.mockReset();
});

describe("GET /auth/session", () => {
  it("returns only the name and email of the signed-in user, uncached", async () => {
    currentUser.mockResolvedValue({ id: "u1", email: "l@example.com", first_name: "Lounes", last_name: "H", phone: null, email_verified: true });
    const response = await GET();
    expect(await response.json()).toEqual({ user: { first_name: "Lounes", email: "l@example.com" } });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("returns no user when signed out or when the API is down", async () => {
    currentUser.mockResolvedValue(null);
    expect(await (await GET()).json()).toEqual({ user: null });
    currentUser.mockRejectedValue(new Error("down"));
    expect(await (await GET()).json()).toEqual({ user: null });
  });
});
