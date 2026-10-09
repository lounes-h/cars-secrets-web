"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { api, ApiError, type FieldErrors } from "@/lib/api";
import { authSchemas, fieldErrors } from "@/lib/auth-schemas";
import { composePhone } from "@/lib/countries";
import { type I18n, localePath, lookup } from "@/lib/i18n";
import { actionI18n } from "@/lib/i18n-server";
import { knownZone } from "@/lib/lot-filters";
import {
  clearSession,
  isSecure,
  OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
  sessionToken,
  setSession,
  visitorIp,
  visitorZone,
} from "@/lib/session";

/** What an action tells its form. Only messages, never tokens or user records. */
export type FormState = {
  ok?: boolean;
  message?: string;
  code?: string;
  errors?: FieldErrors;
  captchaRequired?: boolean;
};

/** API field names that differ from the form's. */
const FORM_FIELD: Record<string, string> = { phone: "phone_number" };

/**
 * The API's answer in the page's language: its codes have words here, and a code without any
 * keeps the API's message. Its field errors stay as the API words them.
 */
function failure(error: unknown, { m }: I18n): FormState {
  if (!(error instanceof ApiError)) throw error;
  const errors: FieldErrors = {};
  for (const [field, message] of Object.entries(error.fields)) errors[FORM_FIELD[field] ?? field] = message;
  const message = lookup(m.auth.apiErrors, error.code) ?? error.message;
  return { message, code: error.code, errors, captchaRequired: error.code === "captcha_required" };
}

/** Actions are public endpoints: re-validate whatever the browser sent. */
function parse<S extends z.ZodType>(schema: S, input: unknown, { m }: I18n): { data: z.output<S> } | { state: FormState } {
  const result = schema.safeParse(input);
  if (result.success) return { data: result.data };
  return { state: { code: "validation", message: m.auth.validation.correctFields, errors: fieldErrors(result.error) } };
}

/**
 * `zone` is the browser's. The API keeps it with the page's language as the dealer's settings:
 * every email they get is in that language, alert times in that zone, until Settings changes them.
 */
export async function registerAction(input: unknown, zone?: unknown): Promise<FormState> {
  const i18n = await actionI18n();
  const parsed = parse(authSchemas(i18n.m.auth).registerSchema, input, i18n);
  if ("state" in parsed) return parsed.state;
  const { data } = parsed;
  const phone = composePhone(data.phone_country, data.phone_number);
  if (data.phone_number && !phone) return { errors: { phone_number: i18n.m.auth.validation.phoneCountry } };
  try {
    await api("/api/auth/register", {
      body: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone,
        password: data.password,
        // The register button says agreeing is what it does, so submitting it is the consent.
        accept_terms: true,
        captcha_token: data.captcha_token || null,
        locale: i18n.locale,
        time_zone: knownZone(typeof zone === "string" ? zone : null) ?? (await visitorZone()) ?? "UTC",
      },
      clientIp: await visitorIp(),
    });
  } catch (error) {
    return failure(error, i18n);
  }
  return { ok: true };
}

export async function loginAction(input: unknown): Promise<FormState> {
  const i18n = await actionI18n();
  const parsed = parse(authSchemas(i18n.m.auth).loginSchema, input, i18n);
  if ("state" in parsed) return parsed.state;
  const { data } = parsed;
  let token: string;
  try {
    ({ token } = await api<{ token: string }>("/api/auth/login", {
      body: { email: data.email, password: data.password, remember: data.remember, captcha_token: data.captcha_token || null },
      clientIp: await visitorIp(),
    }));
  } catch (error) {
    return failure(error, i18n);
  }
  await setSession(token, data.remember);
  redirect(localePath("/active-lots", i18n.locale));
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
  redirect(localePath("/login", (await actionI18n()).locale));
}

export async function forgotPasswordAction(input: unknown): Promise<FormState> {
  const i18n = await actionI18n();
  const parsed = parse(authSchemas(i18n.m.auth).emailSchema, input, i18n);
  if ("state" in parsed) return parsed.state;
  try {
    await api("/api/auth/forgot-password", {
      body: { email: parsed.data.email, captcha_token: parsed.data.captcha_token || null },
      clientIp: await visitorIp(),
    });
  } catch (error) {
    return failure(error, i18n);
  }
  return { ok: true };
}

export async function resendVerificationAction(input: unknown): Promise<FormState> {
  const i18n = await actionI18n();
  const parsed = parse(authSchemas(i18n.m.auth).emailSchema, input, i18n);
  if ("state" in parsed) return parsed.state;
  try {
    await api("/api/auth/resend-verification", {
      body: { email: parsed.data.email, captcha_token: parsed.data.captcha_token || null },
      clientIp: await visitorIp(),
    });
  } catch (error) {
    return failure(error, i18n);
  }
  return { ok: true };
}

export async function resetPasswordAction(input: unknown): Promise<FormState> {
  const i18n = await actionI18n();
  const parsed = parse(authSchemas(i18n.m.auth).resetPasswordSchema, input, i18n);
  if ("state" in parsed) return parsed.state;
  try {
    await api("/api/auth/reset-password", {
      body: { token: parsed.data.token, password: parsed.data.password },
      clientIp: await visitorIp(),
    });
  } catch (error) {
    return failure(error, i18n);
  }
  return { ok: true };
}

/** The emailed code confirms the address and signs the dealer in. */
export async function verifyEmailAction(input: unknown): Promise<FormState> {
  const i18n = await actionI18n();
  const parsed = parse(authSchemas(i18n.m.auth).verifyEmailSchema, input, i18n);
  if ("state" in parsed) return parsed.state;
  const { data } = parsed;
  let token: string;
  try {
    ({ token } = await api<{ token: string }>("/api/auth/verify-email", {
      body: { email: data.email, code: data.code, remember: data.remember },
      clientIp: await visitorIp(),
    }));
  } catch (error) {
    return failure(error, i18n);
  }
  await setSession(token, data.remember);
  redirect(localePath("/active-lots", i18n.locale));
}

/** "Continue with Google / Apple": asks the API for the provider's URL and goes there. */
export async function socialLoginAction(formData: FormData): Promise<void> {
  const { locale } = await actionI18n();
  const provider = String(formData.get("provider") ?? "");
  if (provider !== "google" && provider !== "apple") redirect(localePath("/login?error=invalid_state", locale));
  let start: { authorize_url: string; state: string };
  try {
    // Where the callback lands, in the language the sign-in started in.
    start = await api(`/api/auth/oauth/${provider}/start`, { body: { redirect_to: localePath("/active-lots", locale) } });
  } catch (error) {
    if (error instanceof ApiError) redirect(localePath(`/login?error=${encodeURIComponent(error.code)}`, locale));
    throw error;
  }
  (await cookies()).set(OAUTH_STATE_COOKIE, start.state, oauthStateCookieOptions(isSecure()));
  redirect(start.authorize_url);
}
