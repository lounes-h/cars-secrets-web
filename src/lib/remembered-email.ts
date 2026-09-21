/**
 * The email address last typed in an auth form, kept for this browser tab only
 * (sessionStorage), so moving from "Sign in" to "Forgot password" or "Register" does not mean
 * typing it again. Never put in the URL, where it would reach logs and referrers. Storage can be
 * unavailable (private mode, blocked site data), so every access is guarded.
 */

import { isEmailAddress } from "@/lib/auth-schemas";

const KEY = "cs_email";

export function readRememberedEmail(): string {
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

/** Only a complete address is kept: half-typed ones would prefill the next form with rubbish. */
export function rememberEmail(email: string): void {
  const value = email.trim();
  if (!isEmailAddress(value)) return;
  try {
    window.sessionStorage.setItem(KEY, value);
  } catch {
    // Not remembering is fine.
  }
}

/** Signing out ends the tab's memory of who was here. */
export function forgetEmail(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing stored, nothing to forget.
  }
}
