import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import {
  clearSession,
  currentUser,
  oauthStateCookieOptions,
  safePath,
  sessionCookieOptions,
  setSession,
  visitorIp,
  visitorIpFrom,
} from "@/lib/session";

const { cookieStore, apiMock } = vi.hoisted(() => ({
  cookieStore: { set: vi.fn(), delete: vi.fn(), get: vi.fn() },
  apiMock: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers({ "x-real-ip": "8.8.4.4" }),
}));
vi.mock("@/lib/api", async (original) => ({
  ...(await original<typeof import("@/lib/api")>()),
  api: (...args: unknown[]) => apiMock(...args),
}));

afterEach(() => vi.clearAllMocks());

describe("the session cookie", () => {
  it("is set httpOnly, and secure only in production", async () => {
    await setSession("tok", false);
    expect(cookieStore.set).toHaveBeenCalledWith("cs_session", "tok", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
    vi.stubEnv("NODE_ENV", "production");
    await setSession("tok", true);
    expect(cookieStore.set).toHaveBeenLastCalledWith("cs_session", "tok", expect.objectContaining({ secure: true }));
    vi.unstubAllEnvs();
  });

  it("is deleted on sign-out", async () => {
    await clearSession();
    expect(cookieStore.delete).toHaveBeenCalledWith("cs_session");
  });
});

describe("currentUser", () => {
  it("is null without a session cookie, and never asks the API", async () => {
    cookieStore.get.mockReturnValue(undefined);
    expect(await currentUser()).toBeNull();
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("asks the API who the session belongs to", async () => {
    cookieStore.get.mockReturnValue({ value: "tok" });
    apiMock.mockResolvedValue({ id: "u1" });
    expect(await currentUser()).toEqual({ id: "u1" });
    expect(apiMock).toHaveBeenCalledWith("/api/auth/me", { token: "tok" });
  });

  it("is null for an expired session, but lets other failures through", async () => {
    cookieStore.get.mockReturnValue({ value: "tok" });
    apiMock.mockRejectedValue(new ApiError(401, "unauthorized", "Sign in again."));
    expect(await currentUser()).toBeNull();
    apiMock.mockRejectedValue(new ApiError(503, "unavailable", "Down."));
    await expect(currentUser()).rejects.toThrow("Down.");
  });
});

describe("visitorIp", () => {
  it("reads the request's headers", async () => {
    expect(await visitorIp()).toBe("8.8.4.4");
  });
});

describe("sessionCookieOptions", () => {
  it("persists for 30 days with remember me, secure in production", () => {
    expect(sessionCookieOptions(true, true)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 2592000,
    });
  });

  it("is a browser-session cookie otherwise", () => {
    expect(sessionCookieOptions(false, false)).toEqual({ httpOnly: true, sameSite: "lax", secure: false, path: "/" });
  });
});

describe("oauthStateCookieOptions", () => {
  it("allows the cross-site POST from Apple only over HTTPS", () => {
    expect(oauthStateCookieOptions(true)).toMatchObject({
      sameSite: "none",
      secure: true,
      path: "/auth/callback",
      maxAge: 600,
    });
    expect(oauthStateCookieOptions(false)).toMatchObject({ sameSite: "lax", secure: false });
  });
});

describe("visitorIpFrom", () => {
  it("takes the first forwarded address", () => {
    expect(visitorIpFrom(new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
    expect(visitorIpFrom(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(visitorIpFrom(new Headers())).toBeNull();
  });
});

describe("safePath", () => {
  it("accepts only site-relative paths", () => {
    expect(safePath("/account")).toBe("/account");
    expect(safePath("//evil.test")).toBeNull();
    expect(safePath("https://evil.test")).toBeNull();
    expect(safePath(undefined)).toBeNull();
  });
});
