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
    code: q.get("code"),
    state: q.get("state"),
    user: null,
    error: q.get("error"),
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const form = await request.formData();
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : null;
  };
  return finish(request, (await params).provider, {
    code: field("code"),
    state: field("state"),
    user: field("user"),
    error: field("error"),
  });
}

async function finish(request: NextRequest, provider: string, callback: Callback): Promise<Response> {
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
