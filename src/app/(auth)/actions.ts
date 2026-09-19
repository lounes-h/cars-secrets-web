"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError, type FieldErrors } from "@/lib/api";
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
