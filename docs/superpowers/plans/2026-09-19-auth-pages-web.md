# Auth Pages (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unstyled register, login, forgot/reset password, verify-email and account pages that drive the API's `/api/auth` endpoints through server actions, with Google/Apple buttons, a phone field with every country's flag and calling code, password show/hide, remember-me and a Turnstile captcha where the API asks for one.

**Architecture:** Server actions call the API from the web server (`src/lib/api.ts`) and keep the session token in an httpOnly cookie (`src/lib/session.ts`). The browser never talks to the API. Pages are Server Components; only the forms (they need `useActionState`), the password toggle and the Turnstile widget are client components. Social login redirects to the provider and comes back to a route handler that finishes the handshake with the API.

**Tech Stack:** Next.js 16 App Router, React 19 (`useActionState`), `next/headers` cookies, route handlers, vitest + Testing Library.

**Spec:** `../cars-secrets-api/docs/superpowers/specs/2026-09-19-accounts-auth-design.md` (section "Web").

## Global Constraints

- No styling beyond the existing full-width section padding (`px-4 sm:px-6 lg:px-10`): semantic HTML with `<label>`s, no design system yet.
- Every page has one `h1` and a lede; register every `page.tsx` in `src/lib/routes.ts` (the registry test fails otherwise); build metadata with `metadataForRoute`.
- `API_URL` and `API_INTERNAL_KEY` are server-only; `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is the only new public variable. Never put a secret in `NEXT_PUBLIC_*`.
- `yarn lint && yarn typecheck && yarn test && yarn build` must pass.
- Terminology: **lot**, **sign in / sign out**, **register**.

---

### Task 1: Route registry `noindex`, API client, session helpers, countries

**Files:**
- Modify: `src/lib/routes.ts`, `src/lib/seo/sitemap.ts`, `src/lib/seo/metadata.ts`, `src/lib/seo/fixtures.ts`
- Create: `src/lib/api.ts`, `src/lib/session.ts`, `src/lib/countries.ts` (uses the generated `src/lib/dial-codes.ts`)
- Test: `src/lib/seo/crawl.test.ts` (extend), `src/lib/api.test.ts`, `src/lib/session.test.ts`, `src/lib/countries.test.ts`

**Interfaces produced:**
- `SiteRoute.noindex?: boolean`; `buildSitemap` skips noindex routes; `metadataForRoute` marks them noindex.
- `api<T>(path, { method?, body?, token?, clientIp? }): Promise<T>`; `class ApiError extends Error { status; code; fields }`; `toApiError(status, data)`.
- `SESSION_COOKIE = "cs_session"`, `OAUTH_STATE_COOKIE = "cs_oauth_state"`, `sessionCookieOptions(remember, secure)`, `oauthStateCookieOptions(secure)`, `isSecure()`, `setSession(token, remember)`, `clearSession()`, `sessionToken()`, `currentUser()`, `visitorIp()`, `visitorIpFrom(headers)`, `safePath(value)`, `type User`.
- `countries(locale?)`, `composePhone(countryCode, national)`, `flagEmoji(code)`, `type Country`.

- [ ] **Step 1: Registry and sitemap**

`src/lib/routes.ts`: add to `SiteRoute`:

```ts
  /** Registered (so the page is known) but kept out of the sitemap and marked noindex. */
  noindex?: boolean;
```

and replace the empty registry:

```ts
export const routes: readonly SiteRoute[] = [
  { path: "/register", title: "Create your account", description: "Register for Car's Secrets to search auction lots from Copart, IAA and Manheim and see resale value, total cost, profit and a suggested max bid.", changeFrequency: "yearly", priority: 0.5 },
  { path: "/login", title: "Sign in", description: "Sign in to Car's Secrets with your email and password, or continue with Google or Apple.", changeFrequency: "yearly", priority: 0.5 },
  { path: "/forgot-password", title: "Forgot your password", description: "Request a password reset link by email for your Car's Secrets account.", changeFrequency: "yearly", priority: 0.2 },
  { path: "/reset-password", title: "Choose a new password", description: "Set a new password for your Car's Secrets account from the link we emailed you.", changeFrequency: "yearly", priority: 0.1, noindex: true },
  { path: "/verify-email", title: "Confirm your email", description: "Confirm the email address of your Car's Secrets account, or request a new confirmation email.", changeFrequency: "yearly", priority: 0.1, noindex: true },
  { path: "/account", title: "Your account", description: "Your Car's Secrets account: who you are signed in as, and where to sign out.", changeFrequency: "yearly", priority: 0.1, noindex: true },
];
```

`src/lib/seo/sitemap.ts`: `return routes.filter((route) => !route.noindex).map(...)`.

`src/lib/seo/metadata.ts` in `metadataForRoute`: `noindex: route.noindex, ...overrides` before the spread of overrides (so overrides still win).

`src/lib/seo/fixtures.ts`: add `{ path: "/reset", title: "Reset", description: "Reset page description here.", changeFrequency: "yearly", priority: 0.1, noindex: true }`.

Tests in `src/lib/seo/crawl.test.ts`: the sitemap test expects the three URLs unchanged (the noindex fixture is absent); replace `is empty while no pages are registered` with:

```ts
  it("leaves noindex pages out", () => {
    expect(buildSitemap().map((entry) => entry.url)).not.toContain("https://cars-secrets.test/account");
    expect(buildSitemap().map((entry) => entry.url)).toContain("https://cars-secrets.test/login");
  });
```

and in the llms.txt block replace `omits the key pages section while no pages exist` with `expect(buildLlmsTxt()).not.toContain("## Key pages")` kept as is (no route has `llms`). In `src/lib/seo/metadata.test.ts` add:

```ts
  it("marks noindex routes noindex", () => {
    expect(metadataForRoute("/reset", {}, fixtureRoutes).robots).toEqual({ index: false, follow: true });
  });
```

- [ ] **Step 2: API client**

`src/lib/api.ts`:

```ts
/**
 * Server-side client for the Car's Secrets API. Only the web server calls the API: it forwards
 * the visitor's IP (with the shared internal key, so the API can trust it) and never exposes
 * API_URL or API_INTERNAL_KEY to the browser.
 */

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields: FieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = {
  method?: "GET" | "POST";
  body?: unknown;
  /** Bearer session token of the signed-in user. */
  token?: string;
  /** The visitor's address, forwarded for rate limiting. */
  clientIp?: string | null;
};

export function apiUrl(): string {
  return (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { body, token, clientIp } = options;
  const method = options.method ?? (body === undefined ? "GET" : "POST");
  const headers: Record<string, string> = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  const key = process.env.API_INTERNAL_KEY;
  if (key && clientIp) {
    headers["x-internal-key"] = key;
    headers["x-client-ip"] = clientIp;
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "unavailable", "The service is temporarily unavailable. Please try again in a moment.");
  }
  const data: unknown = await response.json().catch(() => null);
  if (response.ok) return data as T;
  throw toApiError(response.status, data);
}

/** Maps the API's error bodies: a list of field errors (422) or `{code, message}`. */
export function toApiError(status: number, data: unknown): ApiError {
  const detail = (data as { detail?: unknown } | null)?.detail;
  if (Array.isArray(detail)) {
    const fields: FieldErrors = {};
    for (const item of detail as { loc?: unknown[]; msg?: string }[]) {
      const field = item.loc?.[1];
      if (typeof field === "string" && item.msg) fields[field] = item.msg.replace(/^Value error, /, "");
    }
    return new ApiError(status, "validation", "Please correct the highlighted fields.", fields);
  }
  if (detail && typeof detail === "object") {
    const { code, message } = detail as { code?: string; message?: string };
    return new ApiError(status, code ?? "error", message ?? "Something went wrong.");
  }
  return new ApiError(status, "error", "Something went wrong. Please try again.");
}
```

`src/lib/api.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, toApiError } from "@/lib/api";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("API_URL", "http://api.test/");
  vi.stubEnv("API_INTERNAL_KEY", "internal-key");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("api", () => {
  it("posts JSON with the bearer token and the forwarded visitor address", async () => {
    fetchMock.mockResolvedValue(json(200, { ok: true }));
    await expect(api("/api/auth/me", { body: { a: 1 }, token: "tok", clientIp: "1.2.3.4" })).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/auth/me");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"a":1}');
    expect(init.headers).toMatchObject({
      "content-type": "application/json",
      authorization: "Bearer tok",
      "x-internal-key": "internal-key",
      "x-client-ip": "1.2.3.4",
    });
  });

  it("does not send the internal key without a visitor address", async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await api("/api/health");
    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("x-internal-key");
  });

  it("turns error bodies into ApiError", async () => {
    fetchMock.mockResolvedValue(json(403, { detail: { code: "email_unverified", message: "Confirm first." } }));
    await expect(api("/api/auth/login", { body: {} })).rejects.toMatchObject({ status: 403, code: "email_unverified", message: "Confirm first." });
  });

  it("reports an unreachable API as unavailable", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(api("/api/health")).rejects.toMatchObject({ code: "unavailable", status: 0 });
  });
});

describe("toApiError", () => {
  it("maps 422 field errors to their field names", () => {
    const error = toApiError(422, { detail: [{ loc: ["body", "password"], msg: "Use 10 to 128 characters." }, { loc: ["body", "email"], msg: "Value error, bad" }] });
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("validation");
    expect(error.fields).toEqual({ password: "Use 10 to 128 characters.", email: "bad" });
  });

  it("falls back to a generic message", () => {
    expect(toApiError(500, null).message).toMatch(/try again/i);
  });
});
```

- [ ] **Step 3: Session helpers**

`src/lib/session.ts`:

```ts
/** The signed-in dealer's session: an API token kept in an httpOnly cookie on this domain. */

import { cookies, headers } from "next/headers";
import { api, ApiError } from "@/lib/api";

export const SESSION_COOKIE = "cs_session";
export const OAUTH_STATE_COOKIE = "cs_oauth_state";
const REMEMBER_SECONDS = 30 * 24 * 3600;

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email_verified: boolean;
};

export function isSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

/** "Remember me" persists the cookie for 30 days; otherwise it ends with the browser session. */
export function sessionCookieOptions(remember: boolean, secure: boolean) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure,
    path: "/",
    ...(remember ? { maxAge: REMEMBER_SECONDS } : {}),
  };
}

/** Apple posts its callback cross-site, which a Lax cookie would not accompany; None needs Secure. */
export function oauthStateCookieOptions(secure: boolean) {
  return {
    httpOnly: true as const,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    secure,
    path: "/auth/callback",
    maxAge: 600,
  };
}

export async function setSession(token: string, remember: boolean): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions(remember, isSecure()));
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** The signed-in user, or null when there is no valid session. */
export async function currentUser(): Promise<User | null> {
  const token = await sessionToken();
  if (!token) return null;
  try {
    return await api<User>("/api/auth/me", { token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/** The visitor's address as the reverse proxy reports it; null when running without one. */
export function visitorIpFrom(h: Headers): string | null {
  const forwarded = h.get("x-forwarded-for")?.split(",")[0].trim();
  return forwarded || h.get("x-real-ip") || null;
}

export async function visitorIp(): Promise<string | null> {
  return visitorIpFrom(await headers());
}

/** Only a site-relative path may be used as a redirect target after sign-in. */
export function safePath(value: unknown): string | null {
  return typeof value === "string" && /^\/(?!\/)/.test(value) ? value : null;
}
```

`src/lib/session.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { oauthStateCookieOptions, safePath, sessionCookieOptions, visitorIpFrom } from "@/lib/session";

describe("sessionCookieOptions", () => {
  it("persists for 30 days with remember me, secure in production", () => {
    expect(sessionCookieOptions(true, true)).toEqual({ httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 2592000 });
  });
  it("is a browser-session cookie otherwise", () => {
    expect(sessionCookieOptions(false, false)).toEqual({ httpOnly: true, sameSite: "lax", secure: false, path: "/" });
  });
});

describe("oauthStateCookieOptions", () => {
  it("allows the cross-site POST from Apple only over HTTPS", () => {
    expect(oauthStateCookieOptions(true)).toMatchObject({ sameSite: "none", secure: true, path: "/auth/callback", maxAge: 600 });
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
```

- [ ] **Step 4: Countries**

`src/lib/countries.ts`:

```ts
import { DIAL_CODES } from "@/lib/dial-codes";

export type Country = { code: string; name: string; flag: string; dialCode: number };

/** 🇫🇷 from "FR": each letter maps to its regional indicator symbol. */
export function flagEmoji(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Every country with a calling code, named in the given locale and sorted by name. */
export function countries(locale = "en"): Country[] {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const name = (code: string) => {
    try {
      return names.of(code) ?? code;
    } catch {
      return code;
    }
  };
  return DIAL_CODES.map(([code, dialCode]) => ({ code, dialCode, flag: flagEmoji(code), name: name(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

/** Country code + national number typed by the user → E.164 ("+14155552671"), or null when empty. */
export function composePhone(countryCode: string, national: string): string | null {
  const digits = national.replace(/\D/g, "");
  if (!digits) return null;
  const entry = DIAL_CODES.find(([code]) => code === countryCode.toUpperCase());
  return entry ? `+${entry[1]}${digits}` : null;
}
```

`src/lib/countries.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { composePhone, countries, flagEmoji } from "@/lib/countries";

describe("countries", () => {
  it("lists every region with a flag, a name and its calling code, sorted by name", () => {
    const list = countries();
    expect(list.length).toBeGreaterThan(240);
    expect(list.find((c) => c.code === "FR")).toEqual({ code: "FR", name: "France", flag: "🇫🇷", dialCode: 33 });
    expect(list.find((c) => c.code === "US")?.dialCode).toBe(1);
    const names = list.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
    expect(new Set(list.map((c) => c.code)).size).toBe(list.length);
  });
  it("builds flags from the regional indicators", () => {
    expect(flagEmoji("gb")).toBe("🇬🇧");
  });
});

describe("composePhone", () => {
  it("joins the calling code and the digits", () => {
    expect(composePhone("US", "(415) 555-2671")).toBe("+14155552671");
    expect(composePhone("fr", "06 12 34 56 78")).toBe("+33612345678");
  });
  it("is null for an empty number or an unknown country", () => {
    expect(composePhone("US", "  ")).toBeNull();
    expect(composePhone("ZZ", "123")).toBeNull();
  });
});
```

- [ ] **Step 5: Run and commit**

Run: `yarn lint && yarn typecheck && yarn test`. The registry test now fails because the pages do not exist yet? No: it checks pages on disk are registered, not the reverse. Expected: all pass.

```bash
git add src/lib docs/superpowers
git commit -m "feat: API client, session cookie helpers, countries and noindex routes"
```

---

### Task 2: Server actions and the OAuth callback route

**Files:**
- Create: `src/app/(auth)/actions.ts`, `src/app/auth/callback/[provider]/route.ts`, `src/components/auth/messages.ts`
- Test: `src/app/(auth)/actions.test.ts`, `src/app/auth/callback/[provider]/route.test.ts`

**Interfaces produced:**
- `type FormState = { ok?: boolean; message?: string; code?: string; errors?: FieldErrors; captchaRequired?: boolean } | undefined`
- Actions `(prev: FormState, formData: FormData) => Promise<FormState>`: `registerAction`, `loginAction`, `forgotPasswordAction`, `resetPasswordAction`, `verifyEmailAction`, `resendVerificationAction`; plus `logoutAction()` and `socialLoginAction(formData)`.
- `messageFor(code: string): string`.

- [ ] **Step 1: Messages**

`src/components/auth/messages.ts`:

```ts
/** Human text for the error codes that reach a page through the URL (social login callbacks). */
const MESSAGES: Record<string, string> = {
  invalid_state: "The sign-in attempt expired or was tampered with. Please try again.",
  provider_denied: "The sign-in was cancelled.",
  provider_not_configured: "This sign-in method is not available yet.",
  invalid_token: "The provider did not confirm your identity. Please try again.",
  email_required: "The provider did not share an email address, which we need for your account.",
  email_unverified: "That email address is not verified with the provider, so it cannot be used here.",
  unavailable: "The service is temporarily unavailable. Please try again in a moment.",
};

export function messageFor(code: string): string {
  return MESSAGES[code] ?? "Something went wrong. Please try again.";
}
```

- [ ] **Step 2: Actions**

`src/app/(auth)/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { api, ApiError, type FieldErrors } from "@/lib/api";
import { composePhone } from "@/lib/countries";
import { cookies } from "next/headers";
import {
  clearSession,
  isSecure,
  OAUTH_STATE_COOKIE,
  sessionToken,
  setSession,
  oauthStateCookieOptions,
  visitorIp,
} from "@/lib/session";

export type FormState =
  | { ok?: boolean; message?: string; code?: string; errors?: FieldErrors; captchaRequired?: boolean }
  | undefined;

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const checked = (formData: FormData, name: string) => formData.get(name) === "on";
const captcha = (formData: FormData) => text(formData, "cf-turnstile-response") || null;

function failure(error: unknown): FormState {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      code: error.code,
      errors: error.fields,
      captchaRequired: error.code === "captcha_required",
    };
  }
  throw error;
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const national = text(formData, "phone_number");
  const phone = composePhone(text(formData, "phone_country"), national);
  if (national && !phone) return { errors: { phone: "Choose the country of your phone number." } };
  const body = {
    first_name: text(formData, "first_name"),
    last_name: text(formData, "last_name"),
    email: text(formData, "email"),
    phone,
    password: String(formData.get("password") ?? ""),
    accept_terms: checked(formData, "accept_terms"),
    captcha_token: captcha(formData),
  };
  try {
    await api("/api/auth/register", { body, clientIp: await visitorIp() });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const remember = checked(formData, "remember");
  let token: string;
  try {
    ({ token } = await api<{ token: string }>("/api/auth/login", {
      body: {
        email: text(formData, "email"),
        password: String(formData.get("password") ?? ""),
        remember,
        captcha_token: captcha(formData),
      },
      clientIp: await visitorIp(),
    }));
  } catch (error) {
    return failure(error);
  }
  await setSession(token, remember);
  redirect("/account");
}

export async function logoutAction(): Promise<void> {
  const token = await sessionToken();
  if (token) {
    try {
      await api("/api/auth/logout", { method: "POST", body: {}, token });
    } catch {
      // The cookie goes regardless; a revoked or expired session is the same to the user.
    }
  }
  await clearSession();
  redirect("/login");
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await api("/api/auth/forgot-password", {
      body: { email: text(formData, "email"), captcha_token: captcha(formData) },
      clientIp: await visitorIp(),
    });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("password_confirm") ?? "")) {
    return { errors: { password_confirm: "The two passwords differ." } };
  }
  try {
    await api("/api/auth/reset-password", {
      body: { token: text(formData, "token"), password },
      clientIp: await visitorIp(),
    });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

export async function verifyEmailAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await api("/api/auth/verify-email", { body: { token: text(formData, "token") } });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

export async function resendVerificationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await api("/api/auth/resend-verification", {
      body: { email: text(formData, "email"), captcha_token: captcha(formData) },
      clientIp: await visitorIp(),
    });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

/** "Continue with Google / Apple": asks the API for the provider's URL and goes there. */
export async function socialLoginAction(formData: FormData): Promise<void> {
  const provider = text(formData, "provider");
  if (provider !== "google" && provider !== "apple") redirect("/login?error=invalid_state");
  let start: { authorize_url: string; state: string };
  try {
    start = await api(`/api/auth/oauth/${provider}/start`, { body: { redirect_to: "/account" } });
  } catch (error) {
    if (error instanceof ApiError) redirect(`/login?error=${encodeURIComponent(error.code)}`);
    throw error;
  }
  (await cookies()).set(OAUTH_STATE_COOKIE, start.state, oauthStateCookieOptions(isSecure()));
  redirect(start.authorize_url);
}
```

- [ ] **Step 3: Callback route**

`src/app/auth/callback/[provider]/route.ts`:

```ts
/**
 * Where Google (GET) and Apple (POST, form_post) send the visitor back. The state must match
 * the cookie set when the sign-in started; the API finishes the handshake and returns the
 * session token, which becomes the session cookie.
 */

import { type NextRequest, NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";
import {
  isSecure,
  OAUTH_STATE_COOKIE,
  safePath,
  SESSION_COOKIE,
  sessionCookieOptions,
  visitorIpFrom,
} from "@/lib/session";

type Params = { params: Promise<{ provider: string }> };
type Callback = { code: string | null; state: string | null; user: string | null; error: string | null };

export async function GET(request: NextRequest, { params }: Params) {
  const q = request.nextUrl.searchParams;
  return finish(request, (await params).provider, {
    code: q.get("code"), state: q.get("state"), user: null, error: q.get("error"),
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const form = await request.formData();
  const field = (name: string) => (typeof form.get(name) === "string" ? (form.get(name) as string) : null);
  return finish(request, (await params).provider, {
    code: field("code"), state: field("state"), user: field("user"), error: field("error"),
  });
}

export async function finish(request: NextRequest, provider: string, callback: Callback): Promise<Response> {
  const fail = (code: string) => {
    const response = NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(code)}`, request.url), 303);
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  };
  if (callback.error) return fail("provider_denied");
  const expected = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!callback.code || !callback.state || !expected || callback.state !== expected) return fail("invalid_state");

  let result: { token: string; redirect_to: string | null };
  try {
    result = await api(`/api/auth/oauth/${encodeURIComponent(provider)}/callback`, {
      body: { code: callback.code, state: callback.state, user: callback.user },
      clientIp: visitorIpFrom(request.headers),
    });
  } catch (error) {
    if (error instanceof ApiError) return fail(error.code);
    throw error;
  }
  const response = NextResponse.redirect(new URL(safePath(result.redirect_to) ?? "/account", request.url), 303);
  response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions(true, isSecure()));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
```

- [ ] **Step 4: Tests**

`src/app/(auth)/actions.test.ts`:

```ts
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

const { loginAction, registerAction, resetPasswordAction, socialLoginAction } = await import("./actions");

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  apiMock.mockReset();
  setSession.mockReset();
  redirect.mockClear();
});

describe("registerAction", () => {
  it("composes the phone number and posts the form", async () => {
    apiMock.mockResolvedValue({ ok: true });
    const state = await registerAction(undefined, form({
      first_name: " Dana ", last_name: "Lee", email: "d@example.com", phone_country: "FR",
      phone_number: "06 12 34 56 78", password: "long-enough-pw", accept_terms: "on",
      "cf-turnstile-response": "cap",
    }));
    expect(state).toEqual({ ok: true });
    expect(apiMock).toHaveBeenCalledWith("/api/auth/register", {
      body: { first_name: "Dana", last_name: "Lee", email: "d@example.com", phone: "+33612345678",
              password: "long-enough-pw", accept_terms: true, captcha_token: "cap" },
      clientIp: "9.9.9.9",
    });
  });

  it("returns the API's field errors", async () => {
    apiMock.mockRejectedValue(new ApiError(422, "validation", "Fix fields.", { password: "Too short." }));
    const state = await registerAction(undefined, form({ password: "x" }));
    expect(state).toMatchObject({ code: "validation", errors: { password: "Too short." } });
  });
});

describe("loginAction", () => {
  it("stores the session and redirects to the account page", async () => {
    apiMock.mockResolvedValue({ token: "tok" });
    await expect(loginAction(undefined, form({ email: "d@example.com", password: "pw", remember: "on" })))
      .rejects.toThrow("REDIRECT /account");
    expect(setSession).toHaveBeenCalledWith("tok", true);
  });

  it("asks for a captcha when the API requires one", async () => {
    apiMock.mockRejectedValue(new ApiError(429, "captcha_required", "Too many attempts."));
    const state = await loginAction(undefined, form({ email: "d@example.com", password: "pw" }));
    expect(state).toMatchObject({ captchaRequired: true, message: "Too many attempts." });
    expect(setSession).not.toHaveBeenCalled();
  });
});

describe("resetPasswordAction", () => {
  it("rejects a mismatched confirmation before calling the API", async () => {
    const state = await resetPasswordAction(undefined, form({ token: "t", password: "abcdefghij", password_confirm: "other" }));
    expect(state).toMatchObject({ errors: { password_confirm: expect.any(String) } });
    expect(apiMock).not.toHaveBeenCalled();
  });
});

describe("socialLoginAction", () => {
  it("stores the state cookie and redirects to the provider", async () => {
    apiMock.mockResolvedValue({ authorize_url: "https://accounts.google.com/o/oauth2/v2/auth?x=1", state: "st" });
    await expect(socialLoginAction(form({ provider: "google" }))).rejects.toThrow("REDIRECT https://accounts.google.com/o/oauth2/v2/auth?x=1");
    expect(cookieSet).toHaveBeenCalledWith("cs_oauth_state", "st", expect.objectContaining({ httpOnly: true }));
  });

  it("sends unconfigured providers back to the login page with a code", async () => {
    apiMock.mockRejectedValue(new ApiError(501, "provider_not_configured", "Not yet."));
    await expect(socialLoginAction(form({ provider: "apple" }))).rejects.toThrow("REDIRECT /login?error=provider_not_configured");
  });
});
```

`src/app/auth/callback/[provider]/route.test.ts`:

```ts
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

beforeEach(() => apiMock.mockReset());

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
    expect(apiMock).toHaveBeenCalledWith("/api/auth/oauth/google/callback", expect.objectContaining({
      body: { code: "c", state: "real", user: null },
    }));
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
      method: "POST", body, headers: { cookie: "cs_oauth_state=real", "content-type": "application/x-www-form-urlencoded" },
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
```

- [ ] **Step 5: Run and commit**

Run: `yarn lint && yarn typecheck && yarn test`. Expected: pass.

```bash
git add src/app src/components/auth/messages.ts
git commit -m "feat: auth server actions and the social login callback route"
```

---

### Task 3: Components and pages

**Files:**
- Create: `src/components/auth/PasswordField.tsx`, `PhoneField.tsx`, `Turnstile.tsx`, `SocialButtons.tsx`, `RegisterForm.tsx`, `LoginForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, `VerifyEmailForm.tsx`, `ResendVerificationForm.tsx`, `FieldError.tsx`
- Create: `src/app/(auth)/register/page.tsx`, `login/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`, `verify-email/page.tsx`, `src/app/account/page.tsx`
- Test: `src/components/auth/PasswordField.test.tsx`, `PhoneField.test.tsx`, `RegisterForm.test.tsx`, `LoginForm.test.tsx`

Shared pieces:

`src/components/auth/FieldError.tsx`:

```tsx
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert">
      {message}
    </p>
  );
}
```

`src/components/auth/PasswordField.tsx`:

```tsx
"use client";

import { useId, useState } from "react";
import { FieldError } from "@/components/auth/FieldError";

type Props = {
  name?: string;
  label?: string;
  autoComplete: "new-password" | "current-password";
  error?: string;
  minLength?: number;
};

/** Password input with a show/hide toggle; the toggle never submits the form. */
export function PasswordField({ name = "password", label = "Password", autoComplete, error, minLength }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        maxLength={128}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <button type="button" aria-pressed={visible} onClick={() => setVisible((v) => !v)}>
        {visible ? "Hide password" : "Show password"}
      </button>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
```

`src/components/auth/PhoneField.tsx` (Server Component; no interaction needed):

```tsx
import { countries } from "@/lib/countries";
import { FieldError } from "@/components/auth/FieldError";

/** Country (flag, name, calling code) + national number; the action joins them into E.164. */
export function PhoneField({ error, defaultCountry = "US" }: { error?: string; defaultCountry?: string }) {
  return (
    <fieldset>
      <legend>Phone number (optional)</legend>
      <label htmlFor="phone_country">Country</label>
      <select id="phone_country" name="phone_country" defaultValue={defaultCountry} autoComplete="tel-country-code">
        {countries().map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.name} (+{country.dialCode})
          </option>
        ))}
      </select>
      <label htmlFor="phone_number">Number</label>
      <input
        id="phone_number"
        name="phone_number"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "phone-error" : undefined}
      />
      <FieldError id="phone-error" message={error} />
    </fieldset>
  );
}
```

`src/components/auth/Turnstile.tsx`:

```tsx
"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, options: { sitekey: string; action?: string }) => string };
    onloadTurnstileCallback?: () => void;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit";

/**
 * Cloudflare Turnstile widget. It adds a hidden `cf-turnstile-response` input to the form,
 * which the server action forwards to the API. Renders nothing while no site key is set.
 */
export function Turnstile({ action }: { action: string }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey) return;
    const render = () => {
      const el = container.current;
      if (el && window.turnstile && !el.hasChildNodes()) window.turnstile.render(el, { sitekey: siteKey, action });
    };
    if (window.turnstile) render();
    else window.onloadTurnstileCallback = render;
  }, [siteKey, action]);

  if (!siteKey) return null;
  return (
    <>
      <Script src={SCRIPT} strategy="afterInteractive" />
      <div ref={container} />
    </>
  );
}
```

`src/components/auth/SocialButtons.tsx` (Server Component):

```tsx
import { socialLoginAction } from "@/app/(auth)/actions";

export function SocialButtons({ intent }: { intent: "Sign in" | "Register" }) {
  return (
    <form action={socialLoginAction} aria-label={`${intent} with a provider`}>
      <button type="submit" name="provider" value="google">{intent} with Google</button>
      <button type="submit" name="provider" value="apple">{intent} with Apple</button>
    </form>
  );
}
```

`src/components/auth/RegisterForm.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/(auth)/actions";
import { FieldError } from "@/components/auth/FieldError";
import { PasswordField } from "@/components/auth/PasswordField";
import { Turnstile } from "@/components/auth/Turnstile";

export function RegisterForm({ phoneField }: { phoneField: React.ReactNode }) {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const errors = state?.errors ?? {};

  if (state?.ok) {
    return (
      <p role="status">
        Check your email: we sent you a link to confirm your address. Then you can{" "}
        <Link href="/login">sign in</Link>.
      </p>
    );
  }
  return (
    <form action={action} noValidate={false}>
      {state?.message && <p role="alert">{state.message}</p>}
      <div>
        <label htmlFor="first_name">First name</label>
        <input id="first_name" name="first_name" autoComplete="given-name" required maxLength={100} aria-describedby="first_name-error" />
        <FieldError id="first_name-error" message={errors.first_name} />
      </div>
      <div>
        <label htmlFor="last_name">Last name</label>
        <input id="last_name" name="last_name" autoComplete="family-name" required maxLength={100} aria-describedby="last_name-error" />
        <FieldError id="last_name-error" message={errors.last_name} />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required aria-describedby="email-error" />
        <FieldError id="email-error" message={errors.email} />
      </div>
      {phoneField}
      {errors.phone && <FieldError id="phone-action-error" message={errors.phone} />}
      <PasswordField autoComplete="new-password" minLength={10} error={errors.password} />
      <p>Use at least 10 characters. Passwords found in known data breaches are refused.</p>
      <div>
        <input id="accept_terms" name="accept_terms" type="checkbox" required aria-describedby="accept_terms-error" />
        <label htmlFor="accept_terms">I accept the Terms of Use and Privacy Policy</label>
        <FieldError id="accept_terms-error" message={errors.accept_terms} />
      </div>
      <Turnstile action="register" />
      <button type="submit" disabled={pending}>Create account</button>
      <p>
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
```

The `PhoneField` is a Server Component (it builds 245 options with `Intl`), so the page passes it in as a child (`phoneField={<PhoneField error={undefined} />}`); server-side phone errors are shown by the form below it.

`src/components/auth/LoginForm.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/(auth)/actions";
import { PasswordField } from "@/components/auth/PasswordField";
import { Turnstile } from "@/components/auth/Turnstile";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action}>
      {state?.message && (
        <p role="alert">
          {state.message}
          {state.code === "email_unverified" && (
            <>
              {" "}<Link href="/verify-email">Resend the confirmation email</Link>
            </>
          )}
        </p>
      )}
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <PasswordField autoComplete="current-password" />
      <div>
        <input id="remember" name="remember" type="checkbox" />
        <label htmlFor="remember">Remember me</label>
      </div>
      {state?.captchaRequired && <Turnstile action="login" />}
      <button type="submit" disabled={pending}>Sign in</button>
      <p>
        <Link href="/forgot-password">Forgot your password?</Link>
      </p>
      <p>
        New here? <Link href="/register">Create an account</Link>
      </p>
    </form>
  );
}
```

`ForgotPasswordForm.tsx`, `ResendVerificationForm.tsx` (email + Turnstile, success message), `ResetPasswordForm.tsx` (hidden token, PasswordField + confirm, success links to `/login`), `VerifyEmailForm.tsx` (hidden token, one "Confirm my email" button, success links to `/login`) follow the same `useActionState` shape as `LoginForm`; full code is in the repository files created in this task.

Pages (all Server Components, `metadataForRoute(path)`, `<main className="px-4 sm:px-6 lg:px-10 py-8">`, one `h1`, a lede in `<p className="max-w-[65ch]">`):

- `/register`: `if (await currentUser()) redirect("/account")`; `<SocialButtons intent="Register" />`, `<RegisterForm phoneField={<PhoneField />} />`.
- `/login`: same guard; reads `searchParams.error` and shows `messageFor(error)` in `<p role="alert">`; `<SocialButtons intent="Sign in" />`, `<LoginForm />`.
- `/forgot-password`: `<ForgotPasswordForm />`.
- `/reset-password`: reads `searchParams.token`; without it shows "This link is incomplete" and a link to `/forgot-password`; else `<ResetPasswordForm token={token} />`.
- `/verify-email`: with `token` → `<VerifyEmailForm token={token} />`; without → `<ResendVerificationForm />`.
- `/account`: `const user = await currentUser(); if (!user) redirect("/login")`; shows name, email, phone, and `<form action={logoutAction}><button>Sign out</button></form>`.

Component tests (jsdom, `vi.mock("@/app/(auth)/actions", () => ({ registerAction: vi.fn(), loginAction: vi.fn(), socialLoginAction: vi.fn() }))`):
- `PasswordField`: renders `type="password"`, clicking "Show password" switches to `text` and the button reads "Hide password".
- `PhoneField`: the select contains an option "🇫🇷 France (+33)" and defaults to "US".
- `RegisterForm`: labels First name, Last name, Email, Password, the terms checkbox is required, the submit reads "Create account"; with `NEXT_PUBLIC_TURNSTILE_SITE_KEY` unset there is no Turnstile container.
- `LoginForm`: has "Remember me", "Forgot your password?" and "Sign in" button.

- [ ] Run `yarn lint && yarn typecheck && yarn test && yarn build`, then commit: `feat: register, login, password reset, email verification and account pages`.

---

### Task 4: Docs, env, end-to-end check, pull request

- `.env.example`: add `API_URL=http://localhost:8000`, `API_INTERNAL_KEY=` (same value as the API's), `NEXT_PUBLIC_TURNSTILE_SITE_KEY=`.
- `AGENTS.md`: tech stack (server actions call the API), commands (needs the API running), architecture rules (auth pages are dynamic; session cookie; where actions live; forms are the only client components), security rules (three env vars; `API_INTERNAL_KEY` is a secret), current state (pages exist now; `/` still 404).
- `docs/architecture.md`: layers (`(auth)` route group, `components/auth`, `lib/api.ts`, `lib/session.ts`, `lib/countries.ts`), the sign-in flow, social login handshake.
- `docs/security.md`: cookies (`cs_session`, `cs_oauth_state`), CSRF (server actions' origin check + SameSite), env vars, Turnstile hosts and CSP (no `script-src`, so no change), open-redirect guard.
- End to end with the API running on 8001 (`API_URL=http://localhost:8001 yarn dev`): register → copy the token from the API log → `/verify-email?token=…` → confirm → sign in → `/account` → sign out; Google button → `/login?error=provider_not_configured`.
- `git push -u origin feat/auth-pages`; `gh pr create --base main …` referencing the API PR.
