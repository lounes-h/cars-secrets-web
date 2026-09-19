import { describe, expect, it } from "vitest";
import { oauthStateCookieOptions, safePath, sessionCookieOptions, visitorIpFrom } from "@/lib/session";

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
