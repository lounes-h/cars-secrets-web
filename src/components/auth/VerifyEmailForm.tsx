"use client";

import Link from "next/link";
import { useActionState } from "react";
import { verifyEmailAction } from "@/app/(auth)/actions";

/** A button rather than confirming on page load, so mail scanners that open links cannot use the token. */
export function VerifyEmailForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyEmailAction, undefined);
  if (state?.ok) {
    return (
      <p role="status">
        Your email address is confirmed. <Link href="/login">Sign in</Link>
      </p>
    );
  }
  return (
    <form action={action}>
      {state?.message && (
        <p role="alert">
          {state.message} <Link href="/verify-email">Request a new link</Link>
        </p>
      )}
      <input type="hidden" name="token" value={token} />
      <button type="submit" disabled={pending}>
        Confirm my email
      </button>
    </form>
  );
}
