import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { es } from "@/messages/es";

const apiMock = vi.fn();
const setSession = vi.fn();
const cookieSet = vi.fn();
/** The language cookie the proxy keeps: English unless a test sets it. */
const cookieGet = vi.fn<(name: string) => { value: string } | undefined>(() => undefined);
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
  cookies: async () => ({ set: cookieSet, get: cookieGet, delete: vi.fn() }),
  headers: async () => new Headers(),
}));

const {
  loginAction,
  logoutAction,
  registerAction,
  resendVerificationAction,
  resetPasswordAction,
  socialLoginAction,
  forgotPasswordAction,
  verifyEmailAction,
} = await import("./actions");
const session = await import("@/lib/session");

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
    expect(await registerAction(registration, "America/Chicago")).toEqual({ ok: true });
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
        locale: "en",
        time_zone: "America/Chicago",
      },
      clientIp: "9.9.9.9",
    });
  });

  it("gives the API the page's language, and the zone the list kept when the browser's is unknown", async () => {
    apiMock.mockResolvedValue({ ok: true });
    cookieGet.mockImplementation((name) => ({ cs_locale: { value: "es" }, cs_tz: { value: "America/Bogota" } })[name]);
    await registerAction(registration, "Mars/Olympus");
    expect(apiMock.mock.calls[0][1].body).toMatchObject({ locale: "es", time_zone: "America/Bogota" });

    cookieGet.mockImplementation(() => undefined);
    await registerAction(registration);
    expect(apiMock.mock.calls[1][1].body).toMatchObject({ locale: "en", time_zone: "UTC" });
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
  it("stores the session and redirects to the active lots", async () => {
    apiMock.mockResolvedValue({ token: "tok" });
    await expect(loginAction({ email: "d@example.com", password: "pw", remember: true })).rejects.toThrow(
      "REDIRECT /active-lots",
    );
    expect(setSession).toHaveBeenCalledWith("tok", true);
  });

  it("asks for a captcha when the API requires one", async () => {
    apiMock.mockRejectedValue(new ApiError(429, "captcha_required", "Too many attempts."));
    const state = await loginAction({ email: "d@example.com", password: "pw", remember: false });
    expect(state).toMatchObject({ captchaRequired: true, message: "Too many attempts. Complete the captcha to continue." });
    expect(setSession).not.toHaveBeenCalled();
  });

  it("keeps the API's own message for a code it has no words for", async () => {
    apiMock.mockRejectedValue(new ApiError(409, "something_new", "Something new happened."));
    const state = await loginAction({ email: "d@example.com", password: "pw", remember: false });
    expect(state).toMatchObject({ code: "something_new", message: "Something new happened." });
  });
});

describe("in Spanish (the proxy's cookie says es)", () => {
  beforeEach(() => cookieGet.mockImplementation((name) => (name === "cs_locale" ? { value: "es" } : undefined)));
  afterEach(() => cookieGet.mockReset());

  it("words the API's errors and the validation in Spanish", async () => {
    apiMock.mockRejectedValue(new ApiError(401, "invalid_credentials", "Incorrect email or password."));
    expect(await loginAction({ email: "d@example.com", password: "pw", remember: false })).toMatchObject({
      message: es.auth.apiErrors.invalid_credentials,
    });
    expect(await loginAction({ email: "", password: "", remember: false })).toMatchObject({
      message: es.auth.validation.correctFields,
      errors: { email: es.auth.validation.emailRequired, password: es.auth.validation.passwordRequired },
    });
  });

  it("lands on the Spanish pages after signing in, out or with a provider", async () => {
    apiMock.mockResolvedValue({ token: "tok" });
    await expect(loginAction({ email: "d@example.com", password: "pw", remember: false })).rejects.toThrow("REDIRECT /es/active-lots");
    await expect(logoutAction()).rejects.toThrow("REDIRECT /es/login");
    apiMock.mockResolvedValue({ authorize_url: "https://accounts.google.com/x", state: "st" });
    await expect(socialLoginAction(Object.assign(new FormData(), {}))).rejects.toThrow("REDIRECT /es/login?error=invalid_state");
    const google = new FormData();
    google.set("provider", "google");
    await expect(socialLoginAction(google)).rejects.toThrow("REDIRECT https://accounts.google.com/x");
    expect(apiMock).toHaveBeenLastCalledWith("/api/auth/oauth/google/start", { body: { redirect_to: "/es/active-lots" } });
  });
});

describe("verifyEmailAction", () => {
  const input = { email: " d@example.com ", code: "042917", remember: true };

  it("confirms with the code, stores the session and redirects to the active lots", async () => {
    apiMock.mockResolvedValue({ token: "tok", expires_at: "2026-10-22T00:00:00Z" });
    await expect(verifyEmailAction(input)).rejects.toThrow("REDIRECT /active-lots");
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
    expect(apiMock).toHaveBeenCalledWith("/api/auth/oauth/google/start", { body: { redirect_to: "/active-lots" } });
  });

  it("sends unconfigured providers back to the login page with a code", async () => {
    apiMock.mockRejectedValue(new ApiError(501, "provider_not_configured", "Not yet."));
    await expect(socialLoginAction(form({ provider: "apple" }))).rejects.toThrow(
      "REDIRECT /login?error=provider_not_configured",
    );
  });
});

describe("failures other than the API's", () => {
  it("are not turned into form messages", async () => {
    apiMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(forgotPasswordAction({ email: "d@example.com" })).rejects.toThrow("fetch failed");
    await expect(socialLoginAction(new FormData())).rejects.toThrow(
      "REDIRECT /login?error=invalid_state",
    );
    const google = new FormData();
    google.set("provider", "google");
    await expect(socialLoginAction(google)).rejects.toThrow("fetch failed");
  });
});

describe("registerAction phone", () => {
  it("asks for the country when the number cannot be composed without it", async () => {
    const state = await registerAction({ ...registration, phone_country: "", phone_number: "4155552671" });
    expect(state.errors).toEqual({ phone_number: "Choose the country of your phone number." });
    expect(apiMock).not.toHaveBeenCalled();
  });
});

describe("email actions", () => {
  it.each([
    ["forgot password", forgotPasswordAction, "/api/auth/forgot-password"],
    ["resend verification", resendVerificationAction, "/api/auth/resend-verification"],
  ] as const)("%s validates, posts, and passes the API's errors back", async (_name, action, path) => {
    expect((await action({ email: "nope" })).code).toBe("validation");
    apiMock.mockResolvedValue({ ok: true });
    expect(await action({ email: "d@example.com", captcha_token: "cap" })).toEqual({ ok: true });
    expect(apiMock).toHaveBeenLastCalledWith(path, {
      body: { email: "d@example.com", captcha_token: "cap" },
      clientIp: "9.9.9.9",
    });
    apiMock.mockRejectedValue(new ApiError(400, "captcha_failed", "Captcha failed."));
    expect(await action({ email: "d@example.com" })).toMatchObject({ code: "captcha_failed" });
  });
});

describe("resetPasswordAction with the API", () => {
  const input = { token: "t", password: "abcdefghij1!", password_confirm: "abcdefghij1!" };

  it("changes the password", async () => {
    apiMock.mockResolvedValue({ ok: true });
    expect(await resetPasswordAction(input)).toEqual({ ok: true });
    expect(apiMock).toHaveBeenCalledWith("/api/auth/reset-password", {
      body: { token: "t", password: "abcdefghij1!" },
      clientIp: "9.9.9.9",
    });
  });

  it("reports an expired link", async () => {
    apiMock.mockRejectedValue(new ApiError(400, "invalid_token", "This link has expired."));
    expect(await resetPasswordAction(input)).toMatchObject({ code: "invalid_token" });
  });
});

describe("loginAction validation", () => {
  it("never calls the API with a malformed email", async () => {
    expect((await loginAction({ email: "x", password: "pw", remember: false })).code).toBe("validation");
    expect(apiMock).not.toHaveBeenCalled();
  });
});

describe("verifyEmailAction failure", () => {
  it("keeps the validation of the schema", async () => {
    expect((await verifyEmailAction({})).code).toBe("validation");
  });
});

describe("logoutAction", () => {
  it("revokes the session, clears the cookie and goes to sign in, even if the API fails", async () => {
    apiMock.mockRejectedValue(new Error("down"));
    await expect(logoutAction()).rejects.toThrow("REDIRECT /login");
    expect(apiMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST", body: {}, token: "sess" });
    expect(session.clearSession).toHaveBeenCalled();
  });

  it("only clears the cookie when there is no session", async () => {
    vi.mocked(session.sessionToken).mockResolvedValueOnce(undefined);
    await expect(logoutAction()).rejects.toThrow("REDIRECT /login");
    expect(apiMock).not.toHaveBeenCalled();
  });
});
