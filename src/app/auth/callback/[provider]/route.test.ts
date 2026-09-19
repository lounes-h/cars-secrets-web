import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

const apiMock = vi.fn();
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: (...args: unknown[]) => apiMock(...args),
}));

const { GET, POST } = await import("./route");
const params = { params: Promise.resolve({ provider: "google" }) };

function get(query: string, stateCookie?: string) {
  return new NextRequest(`https://web.test/auth/callback/google?${query}`, {
    headers: stateCookie ? { cookie: `cs_oauth_state=${stateCookie}` } : {},
  });
}

beforeEach(() => {
  apiMock.mockReset();
});

describe("OAuth callback", () => {
  it("rejects a state that does not match the cookie", async () => {
    const response = await GET(get("code=c&state=forged", "real"), params);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://web.test/login?error=invalid_state");
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("finishes the handshake, sets the session cookie and redirects", async () => {
    apiMock.mockResolvedValue({ token: "tok", redirect_to: "/account" });
    const response = await GET(get("code=c&state=real", "real"), params);
    expect(apiMock).toHaveBeenCalledWith(
      "/api/auth/oauth/google/callback",
      expect.objectContaining({ body: { code: "c", state: "real", user: null } }),
    );
    expect(response.headers.get("location")).toBe("https://web.test/account");
    const cookies = response.headers.getSetCookie().join("\n");
    expect(cookies).toMatch(/cs_session=tok;.*HttpOnly/);
    expect(cookies).toMatch(/cs_oauth_state=;/);
  });

  it("relays API errors as a login page message", async () => {
    apiMock.mockRejectedValue(new ApiError(400, "invalid_token", "No."));
    const response = await GET(get("code=c&state=real", "real"), params);
    expect(response.headers.get("location")).toBe("https://web.test/login?error=invalid_token");
  });

  it("accepts Apple's form post with the user JSON", async () => {
    apiMock.mockResolvedValue({ token: "tok", redirect_to: null });
    const body = new URLSearchParams({ code: "c", state: "real", user: '{"name":{"firstName":"D"}}' });
    const request = new NextRequest("https://web.test/auth/callback/apple", {
      method: "POST",
      body,
      headers: { cookie: "cs_oauth_state=real", "content-type": "application/x-www-form-urlencoded" },
    });
    const response = await POST(request, { params: Promise.resolve({ provider: "apple" }) });
    expect(apiMock.mock.calls[0][1].body.user).toBe('{"name":{"firstName":"D"}}');
    expect(response.headers.get("location")).toBe("https://web.test/account");
  });

  it("ignores a redirect target that leaves the site", async () => {
    apiMock.mockResolvedValue({ token: "tok", redirect_to: "https://evil.test" });
    const response = await GET(get("code=c&state=real", "real"), params);
    expect(response.headers.get("location")).toBe("https://web.test/account");
  });
});
