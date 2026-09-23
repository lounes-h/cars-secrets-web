import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";

const apiMock = vi.fn();
const setSession = vi.fn();
const cookieSet = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`);
});

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: (...args: unknown[]) => apiMock(...args),
}));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  setSession: (...args: unknown[]) => setSession(...args),
  clearSession: vi.fn(),
  sessionToken: vi.fn(async () => "sess"),
  visitorIp: vi.fn(async () => "9.9.9.9"),
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieSet, get: vi.fn(), delete: vi.fn() }),
  headers: async () => new Headers(),
}));

const { loginAction, registerAction, resetPasswordAction, socialLoginAction, forgotPasswordAction, verifyEmailAction } =
  await import("./actions");

const registration = {
  first_name: " Dana ",
  last_name: "Lee",
  email: "d@example.com",
  phone_country: "US",
  phone_number: "(415) 555-2671",
  password: "long-enough-pw1",
  captcha_token: "cap",
};

beforeEach(() => {
  apiMock.mockReset();
  setSession.mockReset();
  redirect.mockClear();
});

describe("registerAction", () => {
  it("composes the phone number and posts the form", async () => {
    apiMock.mockResolvedValue({ ok: true });
    expect(await registerAction(registration)).toEqual({ ok: true });
    expect(apiMock).toHaveBeenCalledWith("/api/auth/register", {
      body: {
        first_name: "Dana",
        last_name: "Lee",
        email: "d@example.com",
        phone: "+14155552671",
        password: "long-enough-pw1",
        // Submitting the form is the agreement, so the API is always told the terms are accepted.
        accept_terms: true,
        captcha_token: "cap",
      },
      clientIp: "9.9.9.9",
    });
  });

  it("re-validates on the server and never calls the API with bad input", async () => {
    const state = await registerAction({ ...registration, password: "short" });
    expect(state.errors).toMatchObject({ password: expect.any(String) });
    expect(apiMock).not.toHaveBeenCalled();
    expect((await registerAction("not an object")).code).toBe("validation");
  });

  it("puts the API's phone error on the phone number field", async () => {
    apiMock.mockRejectedValue(new ApiError(422, "validation", "Fix fields.", { phone: "Enter a valid phone number." }));
    const state = await registerAction(registration);
    expect(state.errors).toEqual({ phone_number: "Enter a valid phone number." });
  });
});

describe("loginAction", () => {
  it("stores the session and redirects to the account page", async () => {
    apiMock.mockResolvedValue({ token: "tok" });
    await expect(loginAction({ email: "d@example.com", password: "pw", remember: true })).rejects.toThrow(
      "REDIRECT /account",
    );
    expect(setSession).toHaveBeenCalledWith("tok", true);
  });

  it("asks for a captcha when the API requires one", async () => {
    apiMock.mockRejectedValue(new ApiError(429, "captcha_required", "Too many attempts."));
    const state = await loginAction({ email: "d@example.com", password: "pw", remember: false });
    expect(state).toMatchObject({ captchaRequired: true, message: "Too many attempts." });
    expect(setSession).not.toHaveBeenCalled();
  });
});

describe("verifyEmailAction", () => {
  const input = { email: " d@example.com ", code: "042917", remember: true };

  it("confirms with the code, stores the session and redirects to the account page", async () => {
    apiMock.mockResolvedValue({ token: "tok", expires_at: "2026-10-22T00:00:00Z" });
    await expect(verifyEmailAction(input)).rejects.toThrow("REDIRECT /account");
    expect(apiMock).toHaveBeenCalledWith("/api/auth/verify-email", {
      body: { email: "d@example.com", code: "042917", remember: true },
      clientIp: "9.9.9.9",
    });
    expect(setSession).toHaveBeenCalledWith("tok", true);
  });

  it.each(["12345", "1234567", "12a456", "١٢٣٤٥٦", ""])("never sends a malformed code (%j) to the API", async (code) => {
    const state = await verifyEmailAction({ ...input, code });
    expect(state.errors).toMatchObject({ code: "Enter the 6-digit code from the email." });
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("passes a wrong code back to the form without signing in", async () => {
    apiMock.mockRejectedValue(new ApiError(400, "invalid_code", "That code is incorrect or has expired."));
    expect(await verifyEmailAction(input)).toMatchObject({ code: "invalid_code" });
    expect(setSession).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("resetPasswordAction", () => {
  it("rejects a mismatched confirmation before calling the API", async () => {
    const state = await resetPasswordAction({ token: "t", password: "abcdefghij1!", password_confirm: "other" });
    expect(state.errors).toEqual({ password_confirm: "The two passwords differ." });
    expect(apiMock).not.toHaveBeenCalled();
  });
});

describe("forgotPasswordAction", () => {
  it("sends the trimmed email", async () => {
    apiMock.mockResolvedValue({ ok: true });
    expect(await forgotPasswordAction({ email: " d@example.com " })).toEqual({ ok: true });
    expect(apiMock.mock.calls[0][1].body).toEqual({ email: "d@example.com", captcha_token: null });
  });
});

describe("socialLoginAction", () => {
  function form(fields: Record<string, string>) {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    return data;
  }

  it("stores the state cookie and redirects to the provider", async () => {
    apiMock.mockResolvedValue({ authorize_url: "https://accounts.google.com/o/oauth2/v2/auth?x=1", state: "st" });
    await expect(socialLoginAction(form({ provider: "google" }))).rejects.toThrow(
      "REDIRECT https://accounts.google.com/o/oauth2/v2/auth?x=1",
    );
    expect(cookieSet).toHaveBeenCalledWith("cs_oauth_state", "st", expect.objectContaining({ httpOnly: true }));
  });

  it("sends unconfigured providers back to the login page with a code", async () => {
    apiMock.mockRejectedValue(new ApiError(501, "provider_not_configured", "Not yet."));
    await expect(socialLoginAction(form({ provider: "apple" }))).rejects.toThrow(
      "REDIRECT /login?error=provider_not_configured",
    );
  });
});
