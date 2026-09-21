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

const { loginAction, registerAction, resetPasswordAction, socialLoginAction, forgotPasswordAction } = await import(
  "./actions"
);

const registration = {
  first_name: " Dana ",
  last_name: "Lee",
  email: "d@example.com",
  phone_country: "US",
  phone_number: "(415) 555-2671",
  password: "long-enough-pw",
  accept_terms: true,
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
        password: "long-enough-pw",
        accept_terms: true,
        captcha_token: "cap",
      },
      clientIp: "9.9.9.9",
    });
  });

  it("re-validates on the server and never calls the API with bad input", async () => {
    const state = await registerAction({ ...registration, password: "short", accept_terms: false });
    expect(state.errors).toMatchObject({ password: expect.any(String), accept_terms: expect.any(String) });
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

describe("resetPasswordAction", () => {
  it("rejects a mismatched confirmation before calling the API", async () => {
    const state = await resetPasswordAction({ token: "t", password: "abcdefghij!", password_confirm: "other" });
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
