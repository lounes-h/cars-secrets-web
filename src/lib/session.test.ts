import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import {
  clearSession,
  currentUser,
  oauthStateCookieOptions,
  rememberedChoice,
  safePath,
  sessionCookieOptions,
  setSession,
  visitorIp,
  visitorIpFrom,
  visitorZone,
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
    expect(cookieStore.set).toHaveBeenCalledWith("cs_session", "tok", expect.objectContaining({ secure: true }));
    vi.unstubAllEnvs();
  });

  it("is deleted on sign-out", async () => {
    await clearSession();
    expect(cookieStore.delete).toHaveBeenCalledWith("cs_session");
  });
});

describe("the remember me choice", () => {
  it("is kept for a year by a sign-in with remember me, and survives sign-out", async () => {
    await setSession("tok", true);
    expect(cookieStore.set).toHaveBeenCalledWith("cs_remember", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 365 * 24 * 3600,
    });
    await clearSession();
    expect(cookieStore.delete).not.toHaveBeenCalledWith("cs_remember");
  });

  it("is forgotten by a sign-in without it", async () => {
    await setSession("tok", false);
    expect(cookieStore.set).not.toHaveBeenCalledWith("cs_remember", expect.anything(), expect.anything());
    expect(cookieStore.delete).toHaveBeenCalledWith("cs_remember");
  });

  it("reads as ticked only when the cookie says so", async () => {
    cookieStore.get.mockReturnValueOnce({ value: "1" });
    expect(await rememberedChoice()).toBe(true);
    cookieStore.get.mockReturnValueOnce(undefined);
    expect(await rememberedChoice()).toBe(false);
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

describe("visitorZone", () => {
  it("is the zone the filter bar stored, when the runtime knows it", async () => {
    cookieStore.get.mockReturnValueOnce({ value: "America/Chicago" });
    expect(await visitorZone()).toBe("America/Chicago");
    expect(cookieStore.get).toHaveBeenCalledWith("cs_tz");
    cookieStore.get.mockReturnValueOnce({ value: "Mars/Olympus" });
    expect(await visitorZone()).toBeNull();
    cookieStore.get.mockReturnValueOnce(undefined);
    expect(await visitorZone()).toBeNull();
  });
});
