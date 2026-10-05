/** The signed-in dealer's session: an API token kept in an httpOnly cookie on this domain. */

import { cookies, headers } from "next/headers";
import { api, ApiError } from "@/lib/api";
import { knownZone, ZONE_COOKIE } from "@/lib/lot-filters";

export const SESSION_COOKIE = "cs_session";
export const OAUTH_STATE_COOKIE = "cs_oauth_state";
/** The last sign-in's "Remember me" choice, which outlives sign-out to tick the box next time. */
export const REMEMBER_COOKIE = "cs_remember";
const REMEMBER_SECONDS = 30 * 24 * 3600;
const YEAR_SECONDS = 365 * 24 * 3600;

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
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions(remember, isSecure()));
  if (remember) store.set(REMEMBER_COOKIE, "1", { ...sessionCookieOptions(false, isSecure()), maxAge: YEAR_SECONDS });
  else store.delete(REMEMBER_COOKIE);
}

/** Whether the last successful sign-in in this browser had "Remember me" ticked. */
export async function rememberedChoice(): Promise<boolean> {
  return (await cookies()).get(REMEMBER_COOKIE)?.value === "1";
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

/** The visitor's time zone, which the lot list's filter bar keeps in a cookie; null until it has. */
export async function visitorZone(): Promise<string | null> {
  return knownZone((await cookies()).get(ZONE_COOKIE)?.value);
}

/** Only a site-relative path may be used as a redirect target after sign-in. */
export function safePath(value: unknown): string | null {
  return typeof value === "string" && /^\/(?!\/)/.test(value) ? value : null;
}
