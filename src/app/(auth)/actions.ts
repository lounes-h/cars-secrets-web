"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { api, ApiError, type FieldErrors } from "@/lib/api";
import {
  emailSchema,
  fieldErrors,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "@/lib/auth-schemas";
import { composePhone } from "@/lib/countries";
import {
  clearSession,
  isSecure,
  OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
  sessionToken,
  setSession,
  visitorIp,
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

function failure(error: unknown): FormState {
  if (!(error instanceof ApiError)) throw error;
  const errors: FieldErrors = {};
  for (const [field, message] of Object.entries(error.fields)) errors[FORM_FIELD[field] ?? field] = message;
  return { message: error.message, code: error.code, errors, captchaRequired: error.code === "captcha_required" };
}

/** Actions are public endpoints: re-validate whatever the browser sent. */
function parse<S extends z.ZodType>(schema: S, input: unknown): { data: z.output<S> } | { state: FormState } {
  const result = schema.safeParse(input);
  if (result.success) return { data: result.data };
  return { state: { code: "validation", message: "Please correct the highlighted fields.", errors: fieldErrors(result.error) } };
}

export async function registerAction(input: unknown): Promise<FormState> {
  const parsed = parse(registerSchema, input);
  if ("state" in parsed) return parsed.state;
  const { data } = parsed;
  const phone = composePhone(data.phone_country, data.phone_number);
  if (data.phone_number && !phone) return { errors: { phone_number: "Choose the country of your phone number." } };
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
      },
      clientIp: await visitorIp(),
    });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

export async function loginAction(input: unknown): Promise<FormState> {
  const parsed = parse(loginSchema, input);
  if ("state" in parsed) return parsed.state;
  const { data } = parsed;
  let token: string;
  try {
    ({ token } = await api<{ token: string }>("/api/auth/login", {
      body: { email: data.email, password: data.password, remember: data.remember, captcha_token: data.captcha_token || null },
      clientIp: await visitorIp(),
    }));
  } catch (error) {
    return failure(error);
  }
  await setSession(token, data.remember);
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

export async function forgotPasswordAction(input: unknown): Promise<FormState> {
  const parsed = parse(emailSchema, input);
  if ("state" in parsed) return parsed.state;
  try {
    await api("/api/auth/forgot-password", {
      body: { email: parsed.data.email, captcha_token: parsed.data.captcha_token || null },
      clientIp: await visitorIp(),
    });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

export async function resendVerificationAction(input: unknown): Promise<FormState> {
  const parsed = parse(emailSchema, input);
  if ("state" in parsed) return parsed.state;
  try {
    await api("/api/auth/resend-verification", {
      body: { email: parsed.data.email, captcha_token: parsed.data.captcha_token || null },
      clientIp: await visitorIp(),
    });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

export async function resetPasswordAction(input: unknown): Promise<FormState> {
  const parsed = parse(resetPasswordSchema, input);
  if ("state" in parsed) return parsed.state;
  try {
    await api("/api/auth/reset-password", {
      body: { token: parsed.data.token, password: parsed.data.password },
      clientIp: await visitorIp(),
    });
  } catch (error) {
    return failure(error);
  }
  return { ok: true };
}

/** The emailed code confirms the address and signs the dealer in. */
export async function verifyEmailAction(input: unknown): Promise<FormState> {
  const parsed = parse(verifyEmailSchema, input);
  if ("state" in parsed) return parsed.state;
  const { data } = parsed;
  let token: string;
  try {
    ({ token } = await api<{ token: string }>("/api/auth/verify-email", {
      body: { email: data.email, code: data.code, remember: data.remember },
      clientIp: await visitorIp(),
    }));
  } catch (error) {
    return failure(error);
  }
  await setSession(token, data.remember);
  redirect("/account");
}

/** "Continue with Google / Apple": asks the API for the provider's URL and goes there. */
export async function socialLoginAction(formData: FormData): Promise<void> {
  const provider = String(formData.get("provider") ?? "");
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
